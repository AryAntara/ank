import {getAnkiCard,newCard} from "./util.js"

if(process.argv[2] == 'new'){
    await newCard()
    process.exit()
}

let lang = getAnkiCard()
if(typeof lang == 'string'){
    console.log(lang)
    process.exit()
}
console.log('ID :',lang.id,'- EN :',lang.en)
