import { defaultInjuries, defaultTragicDeaths, g } from "../util";
import type {
	Conf,
	GameAttributesLeague,
	GetLeagueOptionsReal,
	InjuriesSetting,
	TragicDeaths,
	UpdateEvents,
} from "../../common/types";
import goatFormula from "../util/goatFormula";

const keys = [
	"godMode",
	"godModeInPast",
	"numGames",
	"numGamesDiv",
	"numGamesConf",
	"numActiveTeams",
	"quarterLength",
	"maxRosterSize",
	"minRosterSize",
	"salaryCap",
	"minPayroll",
	"luxuryPayroll",
	"luxuryTax",
	"minContract",
	"maxContract",
	"minContractLength",
	"maxContractLength",
	"aiTradesFactor",
	"injuryRate",
	"homeCourtAdvantage",
	"rookieContractLengths",
	"rookiesCanRefuse",
	"tragicDeathRate",
	"brotherRate",
	"sonRate",
	"forceRetireAge",
	"salaryCapType",
	"numGamesPlayoffSeries",
	"numPlayoffByes",
	"draftType",
	"draftAges",
	"playersRefuseToNegotiate",
	"allStarGame",
	"allStarNum",
	"allStarType",
	"budget",
	"numSeasonsFutureDraftPicks",
	"foulRateFactor",
	"foulsNeededToFoulOut",
	"foulsUntilBonus",
	"threePointers",
	"pace",
	"threePointTendencyFactor",
	"threePointAccuracyFactor",
	"twoPointAccuracyFactor",
	"blockFactor",
	"stealFactor",
	"turnoverFactor",
	"orbFactor",
	"challengeNoDraftPicks",
	"challengeNoFreeAgents",
	"challengeNoTrades",
	"challengeLoseBestPlayer",
	"challengeNoRatings",
	"challengeFiredLuxuryTax",
	"challengeFiredMissPlayoffs",
	"challengeThanosMode",
	"realPlayerDeterminism",
	"repeatSeason",
	"ties",
	"otl",
	"spectator",
	"elam",
	"elamASG",
	"elamMinutes",
	"elamOvertime",
	"elamPoints",
	"playerMoodTraits",
	"numPlayersOnCourt",
	"numDraftRounds",
	"tradeDeadline",
	"autoDeleteOldBoxScores",
	"difficulty",
	"stopOnInjury",
	"stopOnInjuryGames",
	"aiJerseyRetirement",
	"numPeriods",
	"tiebreakers",
	"pointsFormula",
	"equalizeRegions",
	"realDraftRatings",
	"hideDisabledTeams",
	"hofFactor",
	"injuries",
	"inflationAvg",
	"inflationMax",
	"inflationMin",
	"inflationStd",
	"playoffsByConf",
	"playoffsNumTeamsDiv",
	"playoffsReseed",
	"playerBioInfo",
	"playIn",
	"numPlayersDunk",
	"numPlayersThree",
	"fantasyPoints",
	"goatFormula",
	"draftPickAutoContract",
	"draftPickAutoContractPercent",
	"draftPickAutoContractRounds",
	"dh",
	"draftLotteryCustomNumPicks",
	"draftLotteryCustomChances",
	"passFactor",
	"rushYdsFactor",
	"passYdsFactor",
	"completionFactor",
	"scrambleFactor",
	"sackFactor",
	"fumbleFactor",
	"intFactor",
	"fgAccuracyFactor",
	"fourthDownFactor",
	"onsideFactor",
	"onsideRecoveryFactor",
	"hitFactor",
	"giveawayFactor",
	"takeawayFactor",
	"deflectionFactor",
	"saveFactor",
	"assistFactor",
	"foulFactor",
	"groundFactor",
	"lineFactor",
	"flyFactor",
	"powerFactor",
	"throwOutFactor",
	"strikeFactor",
	"balkFactor",
	"wildPitchFactor",
	"passedBallFactor",
	"hitByPitchFactor",
	"swingFactor",
	"contactFactor",
] as const;

export type Settings = Pick<
	GameAttributesLeague,
	Exclude<
		typeof keys[number],
		| "repeatSeason"
		| "realDraftRatings"
		| "injuries"
		| "tragicDeaths"
		| "goatFormula"
		| "numActiveTeams"
	>
> & {
	repeatSeason: boolean;
	noStartingInjuries: boolean;
	realDraftRatings: Exclude<
		GameAttributesLeague["realDraftRatings"],
		undefined
	>;
	randomization: "none" | "shuffle" | "debuts" | "debutsForever";
	realStats: GetLeagueOptionsReal["realStats"];
	injuries: InjuriesSetting;
	tragicDeaths: TragicDeaths;
	goatFormula: string;
	confs?: Conf[];

	// undefined in DefaultNewLeagueSettings - then it is not possible to validate some settings that depend on it
	numActiveTeams: number | undefined;
};

const updateSettings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		const initialSettings: Settings = {
			godMode: g.get("godMode"),
			godModeInPast: g.get("godModeInPast"),
			numGames: g.get("numGames"),
			numGamesDiv: g.get("numGamesDiv"),
			numGamesConf: g.get("numGamesConf"),
			numActiveTeams: g.get("numActiveTeams"),
			quarterLength: g.get("quarterLength"),
			maxRosterSize: g.get("maxRosterSize"),
			minRosterSize: g.get("minRosterSize"),
			salaryCap: g.get("salaryCap"),
			minPayroll: g.get("minPayroll"),
			luxuryPayroll: g.get("luxuryPayroll"),
			luxuryTax: g.get("luxuryTax"),
			minContract: g.get("minContract"),
			maxContract: g.get("maxContract"),
			minContractLength: g.get("minContractLength"),
			maxContractLength: g.get("maxContractLength"),
			aiTradesFactor: g.get("aiTradesFactor"),
			injuryRate: g.get("injuryRate"),
			homeCourtAdvantage: g.get("homeCourtAdvantage"),
			rookieContractLengths: g.get("rookieContractLengths"),
			rookiesCanRefuse: g.get("rookiesCanRefuse"),
			tragicDeathRate: g.get("tragicDeathRate"),
			brotherRate: g.get("brotherRate"),
			sonRate: g.get("sonRate"),
			forceRetireAge: g.get("forceRetireAge"),
			salaryCapType: g.get("salaryCapType"),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries"),
			numPlayoffByes: g.get("numPlayoffByes"),
			draftType: g.get("draftType"),
			draftAges: g.get("draftAges"),
			playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
			allStarGame: g.get("allStarGame"),
			allStarNum: g.get("allStarNum"),
			allStarType: g.get("allStarType"),
			budget: g.get("budget"),
			numSeasonsFutureDraftPicks: g.get("numSeasonsFutureDraftPicks"),
			foulRateFactor: g.get("foulRateFactor"),
			foulsNeededToFoulOut: g.get("foulsNeededToFoulOut"),
			foulsUntilBonus: g.get("foulsUntilBonus"),
			threePointers: g.get("threePointers"),
			pace: g.get("pace"),
			threePointTendencyFactor: g.get("threePointTendencyFactor"),
			threePointAccuracyFactor: g.get("threePointAccuracyFactor"),
			twoPointAccuracyFactor: g.get("twoPointAccuracyFactor"),
			blockFactor: g.get("blockFactor"),
			stealFactor: g.get("stealFactor"),
			turnoverFactor: g.get("turnoverFactor"),
			orbFactor: g.get("orbFactor"),
			challengeNoDraftPicks: g.get("challengeNoDraftPicks"),
			challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
			challengeNoTrades: g.get("challengeNoTrades"),
			challengeLoseBestPlayer: g.get("challengeLoseBestPlayer"),
			challengeNoRatings: g.get("challengeNoRatings"),
			challengeFiredLuxuryTax: g.get("challengeFiredLuxuryTax"),
			challengeFiredMissPlayoffs: g.get("challengeFiredMissPlayoffs"),
			challengeThanosMode: g.get("challengeThanosMode"),
			realPlayerDeterminism: g.get("realPlayerDeterminism"),
			repeatSeason: !!g.get("repeatSeason"),
			ties: g.get("ties"),
			otl: g.get("otl"),
			spectator: g.get("spectator"),
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			elamMinutes: g.get("elamMinutes"),
			elamOvertime: g.get("elamOvertime"),
			elamPoints: g.get("elamPoints"),
			playerMoodTraits: g.get("playerMoodTraits"),
			numPlayersOnCourt: g.get("numPlayersOnCourt"),
			numDraftRounds: g.get("numDraftRounds"),
			tradeDeadline: g.get("tradeDeadline"),
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			aiJerseyRetirement: g.get("aiJerseyRetirement"),
			numPeriods: g.get("numPeriods"),
			tiebreakers: g.get("tiebreakers"),
			pointsFormula: g.get("pointsFormula"),
			equalizeRegions: g.get("equalizeRegions"),
			hideDisabledTeams: g.get("hideDisabledTeams"),
			noStartingInjuries: false,
			hofFactor: g.get("hofFactor"),
			injuries: g.get("injuries") ?? defaultInjuries,
			inflationAvg: g.get("inflationAvg"),
			inflationMax: g.get("inflationMax"),
			inflationMin: g.get("inflationMin"),
			inflationStd: g.get("inflationStd"),
			playoffsByConf: g.get("playoffsByConf"),
			playoffsNumTeamsDiv: g.get("playoffsNumTeamsDiv"),
			playoffsReseed: g.get("playoffsReseed"),
			playerBioInfo: g.get("playerBioInfo"),
			playIn: g.get("playIn"),
			confs: g.get("confs"),
			numPlayersDunk: g.get("numPlayersDunk"),
			numPlayersThree: g.get("numPlayersThree"),
			fantasyPoints: g.get("fantasyPoints"),
			tragicDeaths: g.get("tragicDeaths") ?? defaultTragicDeaths,
			goatFormula: g.get("goatFormula") ?? goatFormula.DEFAULT_FORMULA,
			draftPickAutoContract: g.get("draftPickAutoContract"),
			draftPickAutoContractPercent: g.get("draftPickAutoContractPercent"),
			draftPickAutoContractRounds: g.get("draftPickAutoContractRounds"),
			dh: g.get("dh"),
			draftLotteryCustomNumPicks: g.get("draftLotteryCustomNumPicks"),
			draftLotteryCustomChances: g.get("draftLotteryCustomChances"),
			passFactor: g.get("passFactor"),
			rushYdsFactor: g.get("rushYdsFactor"),
			passYdsFactor: g.get("passYdsFactor"),
			completionFactor: g.get("completionFactor"),
			scrambleFactor: g.get("scrambleFactor"),
			sackFactor: g.get("sackFactor"),
			fumbleFactor: g.get("fumbleFactor"),
			intFactor: g.get("intFactor"),
			fgAccuracyFactor: g.get("fgAccuracyFactor"),
			fourthDownFactor: g.get("fourthDownFactor"),
			onsideFactor: g.get("onsideFactor"),
			onsideRecoveryFactor: g.get("onsideRecoveryFactor"),
			hitFactor: g.get("hitFactor"),
			giveawayFactor: g.get("giveawayFactor"),
			takeawayFactor: g.get("takeawayFactor"),
			deflectionFactor: g.get("deflectionFactor"),
			saveFactor: g.get("saveFactor"),
			assistFactor: g.get("assistFactor"),
			foulFactor: g.get("foulFactor"),
			groundFactor: g.get("groundFactor"),
			lineFactor: g.get("lineFactor"),
			flyFactor: g.get("flyFactor"),
			powerFactor: g.get("powerFactor"),
			throwOutFactor: g.get("throwOutFactor"),
			strikeFactor: g.get("strikeFactor"),
			balkFactor: g.get("balkFactor"),
			wildPitchFactor: g.get("wildPitchFactor"),
			passedBallFactor: g.get("passedBallFactor"),
			hitByPitchFactor: g.get("hitByPitchFactor"),
			swingFactor: g.get("swingFactor"),
			contactFactor: g.get("contactFactor"),

			// Might as well be undefined, because it will never be saved from this form, only the new league form
			realDraftRatings: g.get("realDraftRatings") ?? "rookie",
			randomization: "none",
			realStats: "none",
		};

		return {
			initialSettings,
		};
	}
};

export default updateSettings;
