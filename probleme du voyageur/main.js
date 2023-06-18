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

async function parseXml(filename) {
  if (!fs.existsSync(filename)) {
    console.log("file " + filename + " doesnt exist");
    return -1;
  }
  const xmlData = fs.readFileSync(filename, "utf8");
  const result = await parseStringPromisified(xmlData);
  return result;
}

function cout(s1, s2) {}

async function generateSolutions() {
  const out = { aller: {}, retour: {} };
  let secondesDate27juillet18h = new Date("2010-07-27T18:00:00").getTime()/ 1000;
  let solutions = []
  const nbSolutions = 40;
  for (let i = 0; i < nbSolutions ;i ++){
    solutions.push({})
  let coutTotal = 0
  for (const date of fs.readdirSync(ROOT)) {
    for (const vol of fs.readdirSync(ROOT + "/" + date)) {
      const result = await parseXml(ROOT + "/" + date + "/" + vol);
      let type = null
      if (date.substring(0, 2) == "07") {
        type = 'aller'
      } else {
        type = 'retour'
      }
      const vols = result["flights"]["flight"];
      if (!solutions[i][type]) {
        solutions[i][type] = {}
        solutions[i][type][vol] = []
      } else if (!solutions[i][type][vol]) {
        solutions[i][type][vol] = []
      }
      let cout = +vols[i].price.reduce((a, v) => +a + +v, 0);
      let secondesDateDepart = new Date(vols[i].depart[0]).getTime() / 1000;
      let secondesDateArrivee = new Date(vols[i].arrive[0]).getTime() / 1000;
      let tempsDattenteAeroport = Math.abs(secondesDate27juillet18h - secondesDateArrivee) 
      let tempsVol = secondesDateArrivee - secondesDateDepart
      coutTotal += cout +  ((tempsDattenteAeroport / 60) * 10)
      solutions[i][type][vol].push({'vol':vols[randomIntFromInterval(0, vols.length -1)], tempsDattenteAeroport, cout, tempsVol})
    
      if (solutions[i][type][vol].length == 2) {
        solutions[i][type][vol] = solutions[i][type][vol][randomIntFromInterval(0,solutions[i][type][vol].length-1)]
      }
      //console.log(result)
    }
    
  }
  solutions[i]['coutTotal'] = coutTotal
}
  
  console.log(solutions)
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
generateSolutions();
hillClimbing()