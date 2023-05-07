const fs = require('fs')
const path = require('path')
const fetch = require('./fetch')
const AYARLAR_PATH = process.cwd()+"/ayarlar.txt"
const ESZAMANLI_FETCH = 3
let currentPromises = []
let inQueue = []
let sfetch = async (...args)=>{
    if(currentPromises.length>=ESZAMANLI_FETCH){
        inQueue.push(args)
        while(currentPromises.length>=ESZAMANLI_FETCH){
            await Promise.all(currentPromises)
        }
        return sfetch(...inQueue.shift())
    }else{
        if(args[1]&&typeof args[1]=="function") args[1]=args[1]()
        let currPromise =  fetch(...args.slice(0,2)).catch(e=>{
            let tries = isNaN(args[args.length-1])?1:args.pop()
            if(tries<5){
                return sfetch(...args.concat(tries+1))
            }else{
                console.error("5 kez denendi fakat istek başarısız oldu.")
                return Promise.reject(e)
            }
        })
        currentPromises.push(currPromise)
        return currPromise.then(e=>e?e.buffer():console.error(args[1].data.slice(0,256))).then(e=>{
            currentPromises.splice(currentPromises.indexOf(currPromise),1)
            return args[2]?args[2](e):e
        })
    }
}
let config;
let parseConfFile = text=>{
    let conf = {}
    text.split(/\r?\n/).forEach(line=>{
        line=line.split("#")[0]
        let [key, value] = line.split('=')
        if(!key) return
        key=key.trim().toLowerCase()
        if(!value) return conf[key] = true
        let splitTest = value.split(':')
        if(splitTest.length > 1) {
            conf[key] = splitTest.map(x=>x.trim())
        }else{
        conf[key] = value.trim()
        }
    })
    return conf
}
let pref = (...elements)=>config[elements.map(e=>e.toLowerCase()).find(e=>config[e])]
let checksums = {}
let currTimeStamp=()=>"["+new Date().toLocaleTimeString()+"] "
let basitChecksum = x=>{
    if(typeof x=="string")x=Buffer.from(x)
    let hash = 0, i, chr;
    for (i = 0; i < x.length; i++) {
        chr  = x[i];
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; 
    }
    return hash;
}
let isLogging = true
let luacFile = (e,from,seviye,optionalReadData)=>{
    let dir=path.dirname(e)
    let initialDir = dir
    if(from){
        dir+="/..".repeat(from.split(/\/|\\/).length-1)
    }
    dir=path.normalize(dir)
    let difference = path.relative(dir,initialDir)
    let prefixToPath = dir
    let noLuacDir = pref("noLuacDir","luacKlasörsüz")
    if(!noLuacDir){
        prefixToPath = path.join(dir,"luac")
        if(!fs.existsSync(prefixToPath))fs.mkdirSync(prefixToPath)
        let lastCreatedDir = prefixToPath
        difference.split(/\/|\\/).forEach(e=>{
            lastCreatedDir = path.join(lastCreatedDir,e)
            if(!fs.existsSync(lastCreatedDir)){
                fs.mkdirSync(lastCreatedDir)
            }
        })
    }

    let baseName = path.basename(e)
        return sfetch("https://luac.mtasa.com/?compile=1&debug=3&obfuscate="+seviye,()=>{return {
            method:"POST",
            headers:{
                "User-Agent":"Rhetorical"
            },
            body:optionalReadData||fs.readFileSync(e)
        }},buff=>{
            let pathToUse =noLuacDir?e:path.join(prefixToPath,difference,baseName)
            pathToUse=pathToUse.replace(/\.lua$/,"")+".luac"
            let currFileExists = fs.existsSync(pathToUse)
            let hasError = buff.slice(0,5).toString()=="ERROR"
            if(!hasError){
            fs.writeFileSync(pathToUse,buff)
            if(isLogging)console.info(currTimeStamp()+e+" dosyası "+(currFileExists?"yeniden ":"")+"derlendi.")
            }else console.error(currTimeStamp()+e+" dosyası derlenirken hata oluştu.\n"+buff.toString()+(pref("warnwhenerror","hatauyarı")?"\u0007":""))
        }).catch(e=>console.error(e))
    
}
if(fs.existsSync(AYARLAR_PATH)){
     config = parseConfFile(fs.readFileSync(AYARLAR_PATH, 'utf8'))
     if(pref("logConfig"))console.info(config)
     isLogging = !pref("nolog","logsuz")
     let klasorlerVeDosyalar = pref("klasörler","seçilenler","dirs")
     let baslangicLuacsiz = pref("noLuacOnStart","başlangıçLuacsız")
     let izlenenKlasorler = 0
     let izlenenDosyalar = 0
        if(klasorlerVeDosyalar){
            let seviye = pref("seviye","level")||"3"
            let istisnalar = pref("istisnalar","exceptions")||[]
            if(!Array.isArray(istisnalar)) istisnalar = [istisnalar]
            istisnalar=istisnalar.map(e=>path.resolve(e)).filter(e=>{
                if(!!e!=e){
                let exists = fs.existsSync(e)
                if(!exists) console.error(`İstisna olarak belirtilen "${e}" bulunamadı.`)
                return exists
                }else return false
            })
            istisnalar=Object.fromEntries(istisnalar.map(e=>[path.resolve(e),true]))
            if(!Array.isArray(klasorlerVeDosyalar)) klasorlerVeDosyalar = [klasorlerVeDosyalar]
            klasorlerVeDosyalar=klasorlerVeDosyalar.map(e=>path.resolve(e)).filter(e=>{
                let exists = fs.existsSync(e)
                if(!exists) console.error(`Seçilenlerden biri olarak belirtilen "${e}" bulunamadı.`)
                return exists
            }).forEach(async function recWatch(e,i,a,from){
                if(!fs.existsSync(e))return
                if(istisnalar[path.resolve(e)])return console.error(`İstisna olarak belirtilen "${e}" konumundaki değişimler izlenmeyecek.`)
                if(fs.statSync(e).isDirectory()){
                    izlenenKlasorler++
                    fs.watch(e, (eventType, filename) => {
                        if(eventType=="rename"&&filename&&checksums[path.join(e,filename)]===undefined){
                            let newE = e.split(/\/|\\/).pop()
                            recWatch(path.join(e,filename),i,a,from?path.join(from,newE):newE)
                        }
                        })
                    fs.readdirSync(e).forEach(f=>{
                        let newE = e.split(/\/|\\/).pop()
                        recWatch(path.join(e,f),i,a,from?path.join(from,newE):newE)
                    })
                }else if(e.endsWith(".lua")){
                    izlenenDosyalar++
                    let file;
                    while(currentPromises.length>=ESZAMANLI_FETCH){
                        await Promise.all(currentPromises)
                    }
                    try{
                     file = fs.readFileSync(e, 'utf8')
                    }catch(_){
                        console.error(`Hata: ${e} dosyası okunamadı.`)
                        return
                    }
                    if(file){
                        checksums[e] = basitChecksum(file)
                        if(!baslangicLuacsiz)luacFile(e,from,seviye,file)
                    }else if(file===undefined)console.error("Okunamadığı için derlenmeyecek, dosya değişimi durumunda tekrar denenecek.")
                    fs.watchFile(e, () => {
                        fs.readFile(e, 'utf8', (err, data) => {
                            if (err){
                                console.error(`Hata: ${e} dosyası okunamadı.`)
                                return
                            }
                            let yeniChecksum = basitChecksum(data)
                            if(checksums[e] != yeniChecksum){
                                luacFile(e,from,seviye)
                                checksums[e] = yeniChecksum
                            }
                        })
                    })
                }
            })
            if(isLogging)console.info(currTimeStamp()+izlenenKlasorler+" klasör ve "+izlenenDosyalar+" dosya izleniyor.")
            if(izlenenKlasorler==0&&izlenenDosyalar==0)console.error("İzlenecek klasör veya dosya bulunamadı. Sonlandırılıyor.")
        }else console.error("Klasörler belirtilmemiş.")

}else{
    console.error('ayarlar.txt dosyası bulunamadı.')
}