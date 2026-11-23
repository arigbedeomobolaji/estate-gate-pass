export type Role = 'RESIDENT' | 'GUARD' | 'ADMIN';
export type PermitStatus = 'APPROVED' | 'CANCELLED';
export type VisitStatus = 'EXPECTED' | 'INSIDE' | 'EXITED' | 'DENIED';
export type Gate = { id:string; name:string; active:boolean; description?:string };
export type User = { id:string; email:string; fullName:string; role:Role; active:boolean; resident?:{id:string;houseNumber:string;phone:string}; guard?:{id:string;assignedGateId?:string} };
export type Permit = { id:string; permitNumber:string; qrToken:string; visitor:{id:string;fullName:string;phone:string}; resident:{id:string;fullName:string;houseNumber:string}; purpose:string; visitDate:string; startTime:string; endTime:string; vehicleRegistration?:string; vehicleType?:string; status:PermitStatus; visit?:{id:string;status:VisitStatus;entryAt?:string;exitAt?:string;entryGate?:string;exitGate?:string} };
