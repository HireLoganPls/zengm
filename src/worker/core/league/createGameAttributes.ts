import { season } from "..";
import {
	DIFFICULTY,
	gameAttributeHasHistory,
	PHASE,
	unwrapGameAttribute,
	WEBSITE_ROOT,
} from "../../../common";
import type {
	Conditions,
	GameAttributesLeague,
	GameAttributesLeagueWithHistory,
} from "../../../common/types";
import { defaultGameAttributes, logEvent } from "../../util";
import { wrap } from "../../util/g";
import getInitialNumGamesConfDivSettings from "../season/getInitialNumGamesConfDivSettings";
import type { LeagueFile, TeamInfo } from "./create";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries";

const createGameAttributes = async (
	{
		leagueFile,
		teamInfos,
		userTid,
		version,
	}: {
		leagueFile: LeagueFile;
		teamInfos: TeamInfo[];
		userTid: number;
		version?: number;
	},
	conditions?: Conditions,
) => {
	const startingSeason = leagueFile.startingSeason;

	const gameAttributes: GameAttributesLeagueWithHistory = {
		...defaultGameAttributes,
		userTid: [
			{
				start: -Infinity,
				value: userTid,
			},
		],
		userTids: [userTid],
		season: startingSeason,
		startingSeason,
		teamInfoCache: teamInfos.map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			imgURLSmall: t.imgURLSmall,
			name: t.name,
			region: t.region,
		})),
		gracePeriodEnd: startingSeason + 2, // Can't get fired for the first two seasons
		numTeams: teamInfos.length,
		numActiveTeams: teamInfos.filter(t => !t.disabled).length,
	};

	if (leagueFile.gameAttributes) {
		for (const [key, value] of Object.entries(leagueFile.gameAttributes)) {
			// userTid is handled special below
			if (key !== "userTid") {
				(gameAttributes as any)[key] = value;
			}

			// Hack to replace null with -Infinity, cause Infinity is not in JSON spec
			if (Array.isArray(value) && value.length > 0 && value[0].start === null) {
				value[0].start = -Infinity;
			}
		}

		// 2nd pass, so we know phase/season from league file were applied already
		if (leagueFile.gameAttributes.userTid !== undefined) {
			const value = leagueFile.gameAttributes.userTid;

			// Handle league file with userTid history, but user selected a new team maybe
			if (gameAttributeHasHistory(value)) {
				const last = value.at(-1);
				if (last.value === userTid) {
					// Bring over history
					gameAttributes.userTid = value;
				} else {
					if (gameAttributes.season === gameAttributes.startingSeason) {
						// If this is first year in the file, put at -Infinity
						gameAttributes.userTid = [
							{
								start: -Infinity,
								value: userTid,
							},
						];
					} else {
						// Bring over history
						gameAttributes.userTid = value;

						// Keep in sync with g.wrap
						let currentSeason = gameAttributes.season;
						if (gameAttributes.phase > PHASE.PLAYOFFS) {
							currentSeason += 1;
						}

						if (last.start === currentSeason) {
							// Overwrite entry for this season
							last.value = userTid;
						} else {
							// Add new entry
							gameAttributes.userTid.push({
								start: currentSeason,
								value: userTid,
							});
						}
					}
				}
			}
		}

		// Special case for userTids - don't use saved value if userTid is not in it
		if (!gameAttributes.userTids.includes(userTid)) {
			gameAttributes.userTids = [userTid];
		}
	}

	// Extra check for easyDifficultyInPast, so that it won't be overwritten by a league file if the user selects Easy
	// when creating a new league.
	if (gameAttributes.difficulty <= DIFFICULTY.Easy) {
		gameAttributes.easyDifficultyInPast = true;
	}

	// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams
	const oldNumGames = unwrapGameAttribute(
		gameAttributes,
		"numGamesPlayoffSeries",
	);
	let newNumGames = oldNumGames;
	let legacyPlayoffs = (gameAttributes as any).numPlayoffRounds !== undefined;
	try {
		season.validatePlayoffSettings({
			numRounds: oldNumGames.length,
			numPlayoffByes: unwrapGameAttribute(gameAttributes, "numPlayoffByes"),
			numActiveTeams: gameAttributes.numActiveTeams,
			playIn: gameAttributes.playIn,
			byConf: gameAttributes.playoffsByConf,
		});
	} catch (error) {
		legacyPlayoffs = true;
	}
	if (legacyPlayoffs) {
		// Handle legacy case where numPlayoffRounds is set
		newNumGames = getValidNumGamesPlayoffSeries(
			oldNumGames,
			(gameAttributes as any).numPlayoffRounds,
			gameAttributes.numActiveTeams,
		);
		delete (gameAttributes as any).numPlayoffRounds;
	}

	// Don't have too many playoff teams in custom leagues... like in a 16 team league, we don't want 16 teams in the playoffs
	if (
		!leagueFile.gameAttributes ||
		!leagueFile.gameAttributes.numGamesPlayoffSeries
	) {
		while (
			2 ** newNumGames.length > 0.75 * gameAttributes.numTeams &&
			newNumGames.length > 1
		) {
			newNumGames.shift();
		}
	}

	// If tiebreakers aren't specified in league file and this is an old league file, tiebreakers should have been random up to now
	if (
		leagueFile.gameAttributes &&
		!leagueFile.gameAttributes.tiebreakers &&
		(version === undefined || version <= 42)
	) {
		if (
			leagueFile.gameAttributes.season !== undefined &&
			leagueFile.gameAttributes.phase !== undefined
		) {
			const actualPhase =
				leagueFile.gameAttributes.nextPhase ?? leagueFile.gameAttributes.phase;

			let currentSeason = leagueFile.gameAttributes.season;
			if (actualPhase >= PHASE.PLAYOFFS) {
				currentSeason += 1;
			}

			// Apply default tiebreakers, while keeping track of when that happened
			const tiebreakers = [
				{
					start: -Infinity,
					value: ["coinFlip"] as GameAttributesLeague["tiebreakers"],
				},
				{
					start: currentSeason,
					value: defaultGameAttributes.tiebreakers[0].value,
				},
			];

			gameAttributes.tiebreakers = tiebreakers;
		}
	}

	// If we're using some non-default value of numGamesPlayoffSeries, set byes to 0 otherwise it might break for football where the default number of byes is 4
	if (JSON.stringify(oldNumGames) !== JSON.stringify(newNumGames)) {
		gameAttributes.numPlayoffByes = wrap(gameAttributes, "numPlayoffByes", 0);
		gameAttributes.numGamesPlayoffSeries = wrap(
			gameAttributes,
			"numGamesPlayoffSeries",
			newNumGames,
		);
	}

	// If cannot handle the play-in tournament, disable
	if (gameAttributes.playIn) {
		if (version !== undefined && version < 46) {
			gameAttributes.playIn = false;
		} else {
			const byConf = await season.getPlayoffsByConf(gameAttributes.season, {
				skipPlayoffSeries: true,
				playoffsByConf: gameAttributes.playoffsByConf,
				confs: unwrapGameAttribute(gameAttributes, "confs"),
			});

			try {
				season.validatePlayoffSettings({
					numRounds: unwrapGameAttribute(
						gameAttributes,
						"numGamesPlayoffSeries",
					).length,
					numPlayoffByes: unwrapGameAttribute(gameAttributes, "numPlayoffByes"),
					numActiveTeams: gameAttributes.numActiveTeams,
					playIn: gameAttributes.playIn,
					byConf,
				});
			} catch (error) {
				console.log("ERROR", error);

				gameAttributes.playIn = false;
			}
		}
	}

	if (gameAttributes.numDraftRounds < 0) {
		throw new Error("numDraftRounds must be a positive number");
	}

	if (gameAttributes.equalizeRegions) {
		let totalPopulation = 0;
		for (const t of teamInfos) {
			totalPopulation += t.pop;
		}

		// Round to 2 digits
		const averagePopulation =
			Math.round((totalPopulation / teamInfos.length) * 100) / 100;

		for (const t of teamInfos) {
			t.pop = averagePopulation;
		}

		if (leagueFile.scheduledEvents) {
			for (const event of leagueFile.scheduledEvents) {
				if (event.type === "expansionDraft") {
					for (const t of event.info.teams) {
						t.pop = averagePopulation;
					}
				} else if (event.type === "teamInfo" && event.info.pop !== undefined) {
					event.info.pop = averagePopulation;
				}
			}
		}
	}

	{
		const info = getInitialNumGamesConfDivSettings(teamInfos, {
			divs: unwrapGameAttribute(gameAttributes, "divs"),
			numGames: gameAttributes.numGames,
			numGamesConf: gameAttributes.numGamesConf,
			numGamesDiv: gameAttributes.numGamesDiv,
		});

		gameAttributes.numGamesDiv = info.numGamesDiv;
		gameAttributes.numGamesConf = info.numGamesConf;

		// Only show warning about changed numGamesDiv and numGamesConf if the initial settings were not default
		if (
			info.altered &&
			(leagueFile.gameAttributes?.numGamesConf !==
				defaultGameAttributes.numGamesConf ||
				leagueFile.gameAttributes?.numGamesDiv !==
					defaultGameAttributes.numGamesDiv)
		) {
			logEvent(
				{
					type: "info",
					text: `"# Division Games" and "# Conference Games" settings were reset because the supplied values did not work. <a href="https://${WEBSITE_ROOT}/manual/customization/schedule-settings/" rel="noopener noreferrer" target="_blank">More details.</a>`,
					saveToDb: false,
				},
				conditions,
			);
		}
	}

	if (gameAttributes.phase === PHASE.DRAFT && leagueFile.draftPicks) {
		const currentDraftPicks = leagueFile.draftPicks.filter(
			dp => dp.season === gameAttributes.season,
		);
		const draftNotStarted =
			currentDraftPicks.every(dp => dp.round === 0) ||
			currentDraftPicks.some(dp => dp.round === 1 && dp.pick === 1);
		if (draftNotStarted) {
			const numDraftPicksCurrent = currentDraftPicks.length;
			if (numDraftPicksCurrent > 0) {
				gameAttributes.numDraftPicksCurrent = numDraftPicksCurrent;
			}
		}
	}

	return gameAttributes;
};

export default createGameAttributes;
