const fs=require('node:fs');
const path=require('node:path');

const source=process.argv[2];
if(!source){console.error('Укажите путь к taimer-voice-recordings.json');process.exit(1)}
const allowed=new Set(['brake','ten','aux-held','aux-ready','big-off','thirty','aux-off','minute','brake-limit','aux-limit','minute-wait']);
const document=JSON.parse(fs.readFileSync(source,'utf8'));
if(document.format!=='brake-timer-voice-v1'||!Array.isArray(document.clips))throw new Error('Неверный формат файла записей');
const audioDir=path.resolve(__dirname,'../site/audio');
const manifest={};
for(const clip of document.clips){
  if(!allowed.has(clip.id)||typeof clip.type!=='string'||typeof clip.dataBase64!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(clip.dataBase64))throw new Error('Некорректная запись');
  const bytes=Buffer.from(clip.dataBase64,'base64');
  if(!bytes.length||bytes.length>15*1024*1024)throw new Error(`Недопустимый размер: ${clip.id}`);
  const extension=clip.type.includes('webm')?'webm':clip.type.includes('mp4')?'m4a':clip.type.includes('ogg')?'ogg':clip.type.includes('wav')?'wav':clip.type.includes('mpeg')?'mp3':null;
  if(!extension)throw new Error(`Неподдерживаемый формат: ${clip.id}`);
  const filename=`${clip.id}.${extension}`;
  fs.writeFileSync(path.join(audioDir,filename),bytes);
  manifest[clip.id]=filename;
}
if(!Object.keys(manifest).length)throw new Error('В файле нет записей');
fs.writeFileSync(path.join(audioDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Добавлено записей: ${Object.keys(manifest).length}`);
