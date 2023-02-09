import fs from "fs"
import {createInterface} from "readline"

// day in a week 
const days = [  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ]
// card path 
const cardPath = fs.existsSync('/home/ary/Storage/Card/') ? '/home/ary/Storage/Card/' : './Card'
const rl = createInterface({input: process.stdin,output: process.stdout})

// get input 
// @param ask: string
// @return new Promise()
function input(ask){
  return new Promise((resolve,reject) => {
    rl.question(ask,data => resolve(data))
  })
}

/**
 *
 * Read file by the path 
 * @param Path: string
 * @return string 
 */
function readFile(path){
  if(!fs.existsSync(path)){
    return { error : 'Maybe you do not set Main Anki you wanna learn' }
  }
  return fs.readFileSync(path,'utf8')  
}

/**
 *
 * Parse Anki Config
 * @param rawAnki: string 
 * @return Object 
 */
function extractAnki(rawAnki) {
    let anki, arrAnkiConf
    anki = []
    arrAnkiConf = rawAnki.split(':').slice(1)
    arrAnkiConf.forEach(item => {
        let id = item.split('id=')[1].split("'")[1]
        let en = item.split('en=')[1].split("'")[1]
        anki.push({id, en})
    })
    return anki
}

// get day name now
function getDay(){
    let day = new Date()
    return days[day.getDay()]
}

// index has used 
function getIndex(){
    let pathIndex = '/home/ary/Storage/Card/.index'
    if(!fs.existsSync(pathIndex)) return []
    return JSON.parse(fs.readFileSync(pathIndex),'utf8')
}

/**
 *
 * insertIndex
 * @param num: number 
 */
function insertIndex(num){
    let pathIndex = '/home/ary/Storage/Card/.index'
    if(!fs.existsSync(pathIndex)){
        fs.writeFileSync(pathIndex,JSON.stringify([num]))
    } else {
        let oldIndexList = JSON.parse(fs.readFileSync(pathIndex),'utf8')
        oldIndexList.push(num)
        fs.writeFileSync(pathIndex, JSON.stringify(oldIndexList))
    }
}

//get random number in 10
function getRandNum(){
    let random = Math.floor(Math.random() * 10) 
    let numHasUsed = getIndex()
    if(numHasUsed.length == 10){
        fs.writeFileSync('/home/ary/Storage/Card/.index','[]')
    }
    if(numHasUsed.includes(random)){
        return getRandNum()
    } else {
        insertIndex(random)
        return random
    }
}

// get anki card 
export function getAnkiCard(){
    let path = `${cardPath}${getDay()}/main.anki`
    , raw = readFile(path)

    // path main.anki not found
    if(raw.error){
        return raw.error 
    }
    
    let anki = extractAnki(raw)
    , randomize = getRandNum()

    return anki[randomize]
}

/**
 *
 * Get All data of your cards 
 */
function allCard(){
    let allAnkiData = []
    let ankiNames = []
    fs.readdirSync(cardPath).forEach(e => {       
      let path = `${cardPath}${e}`
      let info = fs.statSync(path)
      if(info.isDirectory()){
        let ankiFiles = fs.readdirSync(path)
        ankiFiles.forEach(item => {
          if(item === 'main.anki'){
             return
          }
          ankiNames.push(item.split('.')[0])
          let ankiFilePath = `${path}/${item}`
          let ankiData = readFile(ankiFilePath)
          ankiData = extractAnki(ankiData)
          allAnkiData = [...ankiData,...allAnkiData]
        })
        
      }
    })
    return {allAnkiData,ankiNames};
}

/**
 *
 * give anki name 
 * @return insertNewCard() | cardName: string 
 */

// old data from all anki card 
const allData = allCard()
async function insertNewCard(){
  
  let cardName = await input('Your Anki Card Name : ')
  if(allData.ankiNames.includes(cardName)){
    console.clear()
    console.log('(!) Anki Name has been taken')
    console.log('(?) Reference ( The name has used ) : \n')
    console.log(allData.ankiNames.map((e,i) => `${i+1}. ${e}\n`).join(''))
    return await insertNewCard()
  }

  return cardName
}

/**
 *
 * insert Data to card Name 
 * @return insertDataToNewCard() | newData: string 
 */
 
let MaxData = 1
let newData = []
async function insertDataToNewCard(){
  if(MaxData === 11){
    return newData
  }
  
  let id = await input(`\n${MaxData}. id : `)

  // validate data not found in other card data 
  if([...allData.allAnkiData,...newData ].find(e => e.id == id)){
    console.clear()
    console.log('(!) data has been inserted.')
    console.log('(?) choose other.\n')
    return insertDataToNewCard()
  }
  let en = await input(`-> en : `)

  let confirm = await input('\n(?) Apa data sudah benar ? ingin ambil ulang (y) : ')
  console.clear('')
  
  if(confirm === 'y'){
    return await insertDataToNewCard()
  } else {
    newData.push({en,id})
    MaxData++
    return await insertDataToNewCard()
  }
}

/**
 *
 * save card you are input 
 * @param ankiName: string 
 * @param cardData: Array 
 * @return save() | saveCard()
 */
async function saveCard(ankiName,cardData){
  let cardName = ankiName
  console.log(`(!) Card Name : ${cardName}`)
  console.log(`(!) Data Card : `)
  console.log(cardData.map((e,i) => `${i+1}. ID : ${e.id}, EN : ${e.en}\n`).join(''))
  console.log('(?) Jika ada yang salah dari data yang kamu masukan.')
  console.log('Kamu Bisa Mengganti kata tersebut.')
  console.log('Silahkan masukan Data ke berapa yang ingin kamu ganti.')
  console.log('Jika Tidak Tekan Enter untuk menyimpan')
  let id = await input('Data ke : ')
  if(id === ''){
    return await save(ankiName,cardData)
  } else {
    if(isNaN(parseInt(id)) || !cardData[parseInt(id) - 1] ){
      console.clear()
      console.log('(!) Tidak valid data tidak di temukan.')
      return await saveCard(ankiName,cardData)
    } 
    let ID = await input('(?) id = ')
    let EN = await input('(?) en = ')
    cardData[parseInt(id) - 1] =  {en: EN,id: ID}
    console.clear()
    return await saveCard(ankiName,cardData)
  }
}

/**
 *
 * Save Anki Card data 
 * @param ankiName: string 
 * @param cardData: Array 
 */
async function save(ankiName,cardData){
  fs.writeFileSync(`${cardPath}${getDay()}/${ankiName}.anki`,ankiString(cardData))
  let main = await input('(?) Gunakan untuk main di hari ini (y) : ')
  if(main === 'y'){
    fs.writeFileSync(`${cardPath}${getDay()}/main.anki`,ankiString(cardData))
  }
  console.log('(!) Anki Udah siap.')
}

/**
 *
 * Convert Lang data in array to own format
 * @param cardData: Array 
 * @return string 
 */
function ankiString(cardData){
  return cardData.map(e => {
    return `: id='${e.id}',en='${e.en}'`
  }).join('\n')
}

// create new card 
export async function newCard(){
  let cardName = await insertNewCard()
  let cardData = await insertDataToNewCard()
  await saveCard(cardName,cardData)
}


