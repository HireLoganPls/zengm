import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import { useEffect, useState } from "react";
import { isSport, PHASE } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { toWorker } from "../util";
import { MAX_SEASON, MIN_SEASON } from "./NewLeague";

const SelectTeam = () => {
	const [season, setSeason] = useState(MAX_SEASON);
	const [loadingTeams, setLoadingTeams] = useState(true);
	const [tid, setTid] = useState(0);
	const [teams, setTeams] = useState<
		{
			abbrev: string;
			imgURL: string;
			region: string;
			name: string;
			tid: number;
		}[]
	>([]);

	const loadTeams = async (season: number, firstLoad?: boolean) => {
		setLoadingTeams(true);

		const leagueInfo = await toWorker("main", "getLeagueInfo", {
			type: "real",
			season,
			phase: PHASE.REGULAR_SEASON,
			randomDebuts: false,
			realDraftRatings: "draft",
			realStats: "none",
		});
		const newTeams = orderBy(leagueInfo.teams, ["region", "name", "tid"]);

		const prevTeam = teams.find(t => t.tid === tid);
		let newTid;
		if (firstLoad) {
			const index = Math.floor(Math.random() * newTeams.length);
			newTid = newTeams[index].tid;
		} else {
			newTid =
				newTeams.find(t => t.abbrev === prevTeam?.abbrev)?.tid ??
				newTeams.find(t => t.region === prevTeam?.region)?.tid ??
				0;
		}

		setTeams(newTeams);
		setTid(newTid);
		setLoadingTeams(false);
	};

	useEffect(() => {
		loadTeams(MAX_SEASON, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const t = teams.find(t => t.tid === tid);

	return (
		<>
			<form>
				<div className="input-group">
					<select
						className="form-select"
						value={season}
						onChange={async event => {
							const value = parseInt(event.target.value);
							setSeason(value);

							await loadTeams(value);
						}}
						style={{
							maxWidth: 75,
						}}
					>
						{range(MAX_SEASON, MIN_SEASON - 1).map(i => (
							<option key={i} value={i}>
								{i}
							</option>
						))}
					</select>
					<select
						className="form-select"
						value={tid}
						onChange={event => {
							const value = parseInt(event.target.value);
							setTid(value);
						}}
						disabled={loadingTeams}
					>
						{teams.map(t => (
							<option key={t.tid} value={t.tid}>
								{t.region} {t.name}
							</option>
						))}
					</select>
				</div>
			</form>

			{t?.imgURL ? (
				<div
					style={{ width: 128, height: 128 }}
					className="d-flex align-items-center justify-content-center mt-2"
				>
					<img className="mw-100 mh-100" src={t.imgURL} alt="Team logo" />
				</div>
			) : null}
		</>
	);
};

const Exhibition = () => {
	if (!isSport("basketball")) {
		throw new Error("Not supported");
	}

	useTitleBar({
		title: "Exhibition Game",
		hideNewWindow: true,
	});

	return (
		<div className="row" style={{ maxWidth: 600 }}>
			<div className="col-12 col-sm-6">
				<h2>Home</h2>
				<SelectTeam />
			</div>
			<div className="col-12 col-sm-6 mt-3 mt-sm-0">
				<h2>Away</h2>
				<SelectTeam />
			</div>
		</div>
	);
};

export default Exhibition;
