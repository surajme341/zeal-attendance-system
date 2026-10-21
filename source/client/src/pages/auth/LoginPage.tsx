import {useState} from 'react';
import {useAuth} from '../../context/AuthContext';
export function LoginPage(){
 const {login}=useAuth();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-5"><form className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl" onSubmit={async(e)=>{e.preventDefault();setError('');setBusy(true);try{await login(email,password);}catch(e){setError(e instanceof Error?e.message:'Sign in failed.');}finally{setBusy(false);}}}>
 <div className="h-12 w-12 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-5">Z</div><h1 className="text-2xl font-bold text-slate-900">Smart Attendance</h1><p className="text-slate-500 text-sm mt-2 mb-6">Sign in with your Admin, HOD, Faculty or Student account.</p>
 <label className="block text-sm font-medium mb-2" htmlFor="email">Email or user ID</label><input id="email" autoComplete="username" type="text" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border p-3 mb-4"/>
 <label className="block text-sm font-medium mb-2" htmlFor="password">Password</label><input id="password" autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border p-3 mb-4"/>
 {error&&<p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}<button disabled={busy} className="bg-blue-600 text-white font-semibold rounded-lg w-full p-3 disabled:opacity-50">{busy?'Signing in…':'Sign in'}</button><p className="text-xs text-slate-400 mt-5">Contact your Admin if you need an account or a password reset.</p></form></div>;
}
