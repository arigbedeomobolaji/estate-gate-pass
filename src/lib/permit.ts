import crypto from 'node:crypto';
export function hashToken(token:string){return crypto.createHash('sha256').update(token).digest('hex')}
export function makePermitNumber(date:string){return `EST-${date.replaceAll('-','')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`}
export function validTimeWindow(date:string,start:string,end:string,now=new Date()){const today=now.toISOString().slice(0,10);if(today!==date)return today<date?'NOT_YET_VALID':'EXPIRED';const m=now.getHours()*60+now.getMinutes();const s=Number(start.slice(0,2))*60+Number(start.slice(3));const e=Number(end.slice(0,2))*60+Number(end.slice(3));return m<s?'NOT_YET_VALID':m>e?'EXPIRED':'VALID'}
