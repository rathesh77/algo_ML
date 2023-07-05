const XLSX = require("xlsx");
const fs = require("fs");
const { parseString } = require("xml2js");
const util = require("util");
const parseStringPromisified = util.promisify(parseString);

const ROOT = "./ThirdParty/FlightData/2010";

function entierAleatoireEntre(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function parseXml() {

  let vols = {}
  for (const date of ['07-26', '07-27', '08-03', '08-04']) {
    vols[date] = {}
    for (const vol of fs.readdirSync(ROOT + "/" + date)) {
      const xmlData = fs.readFileSync(ROOT + "/" + date + "/" + vol, "utf8");
      const result = await parseStringPromisified(xmlData);
      vols[date][vol] = result["flights"]["flight"]
    }
  }

  return vols;
}

/*  
Cette fonction generate un tableau multidimensionnel de 4000 elements de la forme 
[
  {
    aller: {'BER-LHR.txt': {'vol': {}, 'cout': <int>, 'tempsDattenteAeroport': <int>, 'tempsVol': <int> }...}
    retour: {'LHR-BER.txt': {'vol': {}, 'cout': <int>, 'tempsVol': <int> }...}
  }
  ...
]
 */
async function genererSolutions() {

  const out = { aller: {}, retour: {} };
  let solutions = []
  const nbSolutions = 4000;
  const volsXml = await parseXml()

  let maxArriveeAeroport = -Infinity
  for (let k = 0; k < nbSolutions; k++) {
    solutions.push({})
    let coutTotal = 0
    for (const type of ['aller', 'retour']) {
      for (let i = 0; i < 9; i++) {
        const date = type == 'aller' ? (Math.random() > 0.5 ? '07-26' : '07-27') : (Math.random() > 0.5 ? '08-03' : '08-04')

        const nomVol = fs.readdirSync(ROOT + "/" + date)[i]
        const vols = volsXml[date][nomVol];
        if (!solutions[k][type]) {
          solutions[k][type] = {}
          solutions[k][type][nomVol] = []
        } else if (!solutions[k][type][nomVol]) {
          solutions[k][type][nomVol] = []
        }
        let randVol = entierAleatoireEntre(0, vols.length - 1)
        let cout = +vols[randVol].price.reduce((a, v) => +a + +v, 0);
        let secondesDateDepart = new Date(vols[randVol].depart[0]).getTime() / 1000;
        let secondesDateArrivee = new Date(vols[randVol].arrive[0]).getTime() / 1000;
        let tempsVol = secondesDateArrivee - secondesDateDepart
        if (type == 'aller' && secondesDateArrivee > maxArriveeAeroport)
          maxArriveeAeroport = secondesDateArrivee
        coutTotal += cout
        solutions[k][type][nomVol] = ({ 'vol': vols[randVol], cout, tempsVol })
        if (type == 'aller')
          solutions[k][type][nomVol]['secondesDateArrivee'] = secondesDateArrivee
      }
    }
    solutions[k]['coutTotal'] = coutTotal
  }
  for (let i = 0; i < solutions.length; i++) {
    const vols = Object.keys(solutions[i].aller)

    for (let j = 0; j < vols.length; j++) {
      solutions[i].aller[vols[j]].tempsDattenteAeroport = (maxArriveeAeroport - solutions[i].aller[vols[j]].secondesDateArrivee) / 1000
      solutions[i].coutTotal += (solutions[i].aller[vols[j]].tempsDattenteAeroport / 60) >= 30 ? ((solutions[i].aller[vols[j]].tempsDattenteAeroport / 60) * 2) : 0
      delete solutions[i].aller[vols[j]].secondesDateArrivee

    }
  }

  return solutions
}


async function hillClimbing() {

  const minSolutionsVoisines = function (solutions) {
    let min = {coutTotal: Infinity}
    let a = entierAleatoireEntre(0, solutions.length-2)
    let b = entierAleatoireEntre(a+1, solutions.length-1)

    for (const solution of solutions.slice(a, b + 1)) {
      if (solution.coutTotal < min.coutTotal) {
        min = solution
      }
    }
    return min
  }

  const solutions = await genererSolutions()
  let meilleur = {coutTotal: Infinity}

  while (1) {
    const min = minSolutionsVoisines(solutions)
    if (min.coutTotal >= meilleur.coutTotal) 
      return meilleur
    meilleur = min
  }
  return meilleur
}

async function simulatedAnnealing() {
  let temperature = 10000
  const refroidissement = 0.95

  const solutions = await genererSolutions()

  let haut = solutions[0]
  let bas = haut
  let meilleur = bas
  let maxEtape = 10000
  let etape = 1

  while (etape <= maxEtape && temperature > 100) {

    let neighborIndex = entierAleatoireEntre(0, solutions.length - 1)
    if (solutions[neighborIndex].coutTotal < bas.coutTotal || Math.pow(Math.exp(1), ((-haut.coutTotal-bas.coutTotal)/temperature)) > Math.random()) {
      const tmp = bas
      bas = solutions[neighborIndex]
      haut = tmp
      temperature *= refroidissement
      meilleur = bas
    }

    etape++
  }

  return meilleur
}

async function geneticAlgorithm() {

  const solutions = (await genererSolutions()).sort((a, b) => a.coutTotal > b.coutTotal)
  const n = 1200
  const nextGeneration = solutions.slice(0, n)

  // PAS FINI
}

async function main() {
  let res1 = await hillClimbing()
  let res2 = await simulatedAnnealing()
  console.log(res1)
  console.log(res2)
  console.log('end')

}

main()