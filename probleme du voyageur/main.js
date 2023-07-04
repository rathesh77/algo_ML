const XLSX = require("xlsx");
const fs = require("fs");
const { parseString } = require("xml2js");
const util = require("util");
const parseStringPromisified = util.promisify(parseString);

const ROOT = "./ThirdParty/FlightData/2010";

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function parseXml() {

  let flights = {}
  for (const date of ['07-26', '07-27', '08-03', '08-04']) {
    flights[date] = {}
    for (const vol of fs.readdirSync(ROOT + "/" + date)) {
      const xmlData = fs.readFileSync(ROOT + "/" + date + "/" + vol, "utf8");
      const result = await parseStringPromisified(xmlData);
      flights[date][vol] = result["flights"]["flight"]
    }
  }

  return flights;
}

function cout(s1, s2) {}

async function generateSolutions() {
  const out = { aller: {}, retour: {} };
  let secondesDate27juillet18h = new Date("2010-07-27T18:00:00").getTime() / 1000;
  let solutions = []
  const nbSolutions = 4000;
  for (let k = 0; k < nbSolutions; k++) {
    solutions.push({})
    let coutTotal = 0
    for (const type of ['aller', 'retour']) {
      for (let i = 0; i < 9; i++) {
        const date = type == 'aller' ? (Math.random() > 0.5 ? '07-26' : '07-27') : (Math.random() > 0.5 ? '08-03' : '08-04')

        const nomVol = fs.readdirSync(ROOT + "/" + date)[i]
        const vols = flights[date][nomVol];
        if (!solutions[k][type]) {
          solutions[k][type] = {}
          solutions[k][type][nomVol] = []
        } else if (!solutions[k][type][nomVol]) {
          solutions[k][type][nomVol] = []
        }
        let randVol = randomIntFromInterval(0, vols.length - 1)
        let cout = +vols[randVol].price.reduce((a, v) => +a + +v, 0);
        let secondesDateDepart = new Date(vols[randVol].depart[0]).getTime() / 1000;
        let secondesDateArrivee = new Date(vols[randVol].arrive[0]).getTime() / 1000;
        let tempsDattenteAeroport = Math.abs(secondesDate27juillet18h - secondesDateArrivee)
        let tempsVol = secondesDateArrivee - secondesDateDepart
        coutTotal += cout + ((tempsDattenteAeroport / 60) * 10)
        solutions[k][type][nomVol] = ({ 'vol': vols[randVol], tempsDattenteAeroport, cout, tempsVol })


      }
    }
    solutions[k]['coutTotal'] = coutTotal
  }

  return solutions
}


async function hillClimbing() {

  const minSolutionsVoisines = function (begin, end, solutions) {
    let min = Infinity
    for (const solution of solutions.slice(begin, end)) {
      if (solution.coutTotal < min) {
        min = solution.coutTotal
      }
    }
    return min
  }

  const solutions = await generateSolutions()
  let i = 0
  let bestSolution = Infinity
  let steps = 10
  for (;i < solutions.length; i+= steps) {
    const min = minSolutionsVoisines(i, i + steps, solutions)
    if (min < bestSolution) 
      bestSolution = min
    else 
      break
  }
  return bestSolution
}

async function simulatedAnnealing() {
  let temperature = 1000000
  const cool = 0.95

  const solutions = await generateSolutions()

  let highCost = solutions[0].coutTotal
  let lowCost = highCost
  let bestSolution = lowCost
  let maxStep = 10000
  let step = 1

  while (step <= maxStep && temperature > 100) {

    let neighborIndex = randomIntFromInterval(0, solutions.length - 1)
    if (solutions[neighborIndex].coutTotal < lowCost || Math.pow(Math.exp(1), ((-highCost-lowCost)/temperature)) > Math.random()) {
      const temp = lowCost
      lowCost = solutions[neighborIndex].coutTotal
      highCost = temp
      temperature *= cool
      bestSolution = lowCost
    }

    step++
  }

  return bestSolution
}
let flights = null
async function main () {
  flights = await parseXml()
  //await hillClimbing()
  await simulatedAnnealing()
}
//hillClimbing()
main()