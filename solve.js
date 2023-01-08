import { solvers } from "solvers.js";

export async function main(ns) {
    ns.disableLog("scan");
    ns.disableLog("sleep");
//    while (true) {
        attemptAllContracts(ns);
//        await ns.sleep(1800);
//    }
}

export function attemptAllContracts(ns) {
    const contracts = getContracts(ns);
    ns.print(`Found ${contracts.length} contracts.`);
    for (const contract of contracts) {
        attemptContract(ns, contract);
    }
}

export function getContracts(ns) {
    const contracts = [];
    for (const host of getAllHosts(ns)) {
        for (const file of ns.ls(host)) {
            if (file.match(/\.cct$/)) {
                const contract = {
                    host: host,
                    file: file,
                    type: ns.codingcontract.getContractType(file, host),
                    triesRemaining: ns.codingcontract.getNumTriesRemaining(file, host)
                };
                if (contracts.length < 25) {
                    contracts.push(contract);
                }
            }
        }
    }
    return contracts;
}

export function attemptContract(ns, contract) {
    const solver = solvers[contract.type];
    if (solver) {
        ns.print("Attempting " + JSON.stringify(contract, null, 2));
        const solution = solver(ns.codingcontract.getData(contract.file, contract.host));
        const reward = ns.codingcontract.attempt(solution, contract.file, contract.host, { returnReward: true });
        if (reward) {
            ns.tprint(`${reward} for solving "${contract.type}" on ${contract.host}`);
        }
        else {
            ns.tprint(`ERROR: Failed to solve "${contract.type}" on ${contract.host}`);
        }
    }
    else {
        ns.tprint(`WARNING: No solver for "${contract.type}" on ${contract.host}`);
    }
}

function getAllHosts(ns) {
    var scanned = ns.scan("home");
    var servers = new Set();
    servers.add("home");
    while (scanned.length > 0) {
        const s = scanned.pop();
        if (!servers.has(s)) {
            servers.add(s);
            scanned = scanned.concat(ns.scan(s));
        }
    }
    var owned = ns.getPurchasedServers();
    var l = owned.length;
    var i;
    if (l) {
        while (i < l) {
            servers.delete(owned[i]);
            i++;
        }
    }
    servers = Array.from(servers);
    return servers;
}
