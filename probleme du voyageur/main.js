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
  const flights = await parseXml()

  let maxArriveeAeroport = -Infinity
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
        let cout = +vols[randVol].price.reduce((a, v) => +a + +v, 0);        let secondesDateDepart = new Date(vols[randVol].depart[0]).getTime() / 1000;
        let secondesDateArrivee = new Date(vols[randVol].arrive[0]).getTime() / 1000;
        let tempsVol = secondesDateArrivee - secondesDateDepart
        if (secondesDateArrivee > maxArriveeAeroport)
          maxArriveeAeroport = secondesDateArrivee
        coutTotal += cout
        solutions[k][type][nomVol] = ({ 'vol': vols[randVol], cout, tempsVol, secondesDateArrivee })
      }
    }
    solutions[k]['coutTotal'] = coutTotal
  }
  for (let i = 0; i < solutions.length; i++) {
    for (let j = 0; j < solutions[i].aller.length; j++) {
      solutions[i].aller[j].tempsDattenteAeroport = maxArriveeAeroport - solutions[i].aller[j].secondesDateArrivee
      solutions[i].coutTotal += ((solutions[i].aller[j].tempsDattenteAeroport / 60) * 10)
    }
  }

  return solutions
}


async function hillClimbing() {

  const minSolutionsVoisines = function (solutions) {
    let min = {coutTotal: Infinity}
    let a = randomIntFromInterval(0, solutions.length-2)
    let b = randomIntFromInterval(a+1, solutions.length-1)

    for (const solution of solutions.slice(a, b + 1)) {
      if (solution.coutTotal < min.coutTotal) {
        min = solution
      }
    }
    return min
  }

  const solutions = await generateSolutions()
  let bestSolution = {coutTotal: Infinity}

  while (1) {
    const min = minSolutionsVoisines(solutions)
    if (min.coutTotal >= bestSolution.coutTotal) 
      return bestSolution
    bestSolution = min
  }
  return bestSolution
}

async function simulatedAnnealing() {
  let temperature = 1000000
  const cool = 0.95

  const solutions = await generateSolutions()

  let highCost = solutions[0]
  let lowCost = highCost
  let bestSolution = lowCost
  let maxStep = 10000
  let step = 1

  while (step <= maxStep && temperature > 100) {

    let neighborIndex = randomIntFromInterval(0, solutions.length - 1)
    if (solutions[neighborIndex].coutTotal < lowCost.coutTotal || Math.pow(Math.exp(1), ((-highCost.coutTotal-lowCost.coutTotal)/temperature)) > Math.random()) {
      const temp = lowCost
      lowCost = solutions[neighborIndex]
      highCost = temp
      temperature *= cool
      bestSolution = lowCost
    }

    step++
  }

  return bestSolution
}
async function main() {
  let res1 = await hillClimbing()
  let res2 = await simulatedAnnealing()
  console.log('end')
}

main()