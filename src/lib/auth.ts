import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { demoLogin, getDemoUser } from './demo-store';
import type { User } from './types';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');
const COOKIE='estate_session';
export async function signIn(email:string,password:string){
 if(process.env.DEMO_MODE==='true') { const u=demoLogin(email,password); if(!u)return null; return issue(u); }
 const {prisma}=await import('./prisma'); const bcrypt=(await import('bcryptjs')).default; const db=await prisma.user.findUnique({where:{email},include:{resident:true,guard:true}}); if(!db||!db.active||!(await bcrypt.compare(password,db.passwordHash))) return null; return issue({id:db.id,email:db.email,fullName:db.fullName,role:db.role as User['role'],active:db.active,resident:db.resident?{id:db.resident.id,houseNumber:db.resident.houseNumber,phone:db.resident.phone}:undefined,guard:db.guard?{id:db.guard.id,assignedGateId:db.guard.assignedGateId||undefined}:undefined});
}
async function issue(user:User){const token=await new SignJWT({uid:user.id,role:user.role}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('8h').sign(secret); (await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*8}); return user;}
export async function getSession():Promise<User|null>{try{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const {payload}=await jwtVerify(token,secret);const uid=String(payload.uid);if(process.env.DEMO_MODE==='true')return getDemoUser(uid);const {prisma}=await import('./prisma');const u=await prisma.user.findUnique({where:{id:uid},include:{resident:true,guard:true}});if(!u||!u.active)return null;return {id:u.id,email:u.email,fullName:u.fullName,role:u.role as User['role'],active:u.active,resident:u.resident?{id:u.resident.id,houseNumber:u.resident.houseNumber,phone:u.resident.phone}:undefined,guard:u.guard?{id:u.guard.id,assignedGateId:u.guard.assignedGateId||undefined}:undefined};}catch{return null}}
export async function signOut(){(await cookies()).delete(COOKIE)}
export function requireRole(user:User|null,roles:User['role'][]){return !!user&&roles.includes(user.role)}
