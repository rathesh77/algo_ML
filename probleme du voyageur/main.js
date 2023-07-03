const XLSX = require("xlsx");
const fs = require("fs");
const { parseString } = require("xml2js");
const util = require("util");
const parseStringPromisified = util.promisify(parseString);

const ROOT = "./ThirdParty/FlightData/2010";

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function parseXlsx(filename) {
  if (!fs.existsSync(filename)) {
    console.log("file " + filename + " doesnt exist");
    return -1;
  }
  const workbook = XLSX.readFile(filename);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return jsonData;
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
    for (let i = 0; i < 9; i++) {
      const date = Math.random() > 0.5 ? '07-26' : '07-27'
      let type = 'aller'
      const vol = fs.readdirSync(ROOT + "/" + date)[i]
      const vols = flights[date][vol];
      if (!solutions[k][type]) {
        solutions[k][type] = {}
        solutions[k][type][vol] = []
      } else if (!solutions[k][type][vol]) {
        solutions[k][type][vol] = []
      }
      let randVol = randomIntFromInterval(0, vols.length - 1)
      let cout = +vols[randVol].price.reduce((a, v) => +a + +v, 0);
      let secondesDateDepart = new Date(vols[randVol].depart[0]).getTime() / 1000;
      let secondesDateArrivee = new Date(vols[randVol].arrive[0]).getTime() / 1000;
      let tempsDattenteAeroport = Math.abs(secondesDate27juillet18h - secondesDateArrivee)
      let tempsVol = secondesDateArrivee - secondesDateDepart
      coutTotal += cout + ((tempsDattenteAeroport / 60) * 10)
      solutions[k][type][vol] = ({ 'vol': vols[randVol], tempsDattenteAeroport, cout, tempsVol })


    }
    for (let i = 0; i < 9; i++) {
      const date = Math.random() > 0.5 ? '08-03' : '08-04'
      let type = 'retour'
      const vol = fs.readdirSync(ROOT + "/" + date)[i]
      const vols = flights[date][vol];
      if (!solutions[k][type]) {
        solutions[k][type] = {}
        solutions[k][type][vol] = []
      } else if (!solutions[k][type][vol]) {
        solutions[k][type][vol] = []
      }
      let randVol = randomIntFromInterval(0, vols.length - 1)
      let cout = +vols[randVol].price.reduce((a, v) => +a + +v, 0);
      let secondesDateDepart = new Date(vols[randVol].depart[0]).getTime() / 1000;
      let secondesDateArrivee = new Date(vols[randVol].arrive[0]).getTime() / 1000;
      let tempsDattenteAeroport = Math.abs(secondesDate27juillet18h - secondesDateArrivee)
      let tempsVol = secondesDateArrivee - secondesDateDepart
      coutTotal += cout + ((tempsDattenteAeroport / 60) * 10)
      solutions[k][type][vol] = ({ 'vol': vols[randVol], tempsDattenteAeroport, cout, tempsVol })


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
  let temperature = 100000
  let cool = 0.95
  const solutions = await generateSolutions()
  let highCost = solutions[0].coutTotal
  let lowCost = highCost
  let bestSolution = lowCost
  for (let i = 1;i < solutions.length && temperature > 0; i++) {
    if (solutions[i].coutTotal < lowCost) {
      const temp = lowCost
      lowCost = solutions[i].coutTotal
      highCost = temp
      const probability = Math.pow(Math.exp(1), ((-highCost-lowCost)/temperature ))
      if (probability > Math.random() * 2) {
        temperature *= cool
        bestSolution = lowCost
      }
    }

  }
  return bestSolution
}
let flights = null
async function main () {
  flights = await parseXml()
  await hillClimbing()
  //await simulatedAnnealing()
}
//hillClimbing()
main()