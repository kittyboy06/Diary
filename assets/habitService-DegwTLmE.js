import{c as f,s as i}from"./index-DQ_HIcJs.js";import{t as h}from"./format-mVbgGZla.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=f("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=f("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=f("Smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]]);function x(t,e){const a=h(t.start),r=h(t.end);let s=+a>+r;const c=s?+a:+r,o=s?r:a;o.setHours(0,0,0,0);let l=1;const d=[];for(;+o<=c;)d.push(h(o)),o.setDate(o.getDate()+l),o.setHours(0,0,0,0);return s?d.reverse():d}const C=async(t,e,a,r,s=null)=>{const{data:c,error:o}=await i.from("user_habits").insert([{user_id:t,name:e,target_days:a,color:r,collection_id:s}]).select().single();if(o)throw o;return c},H=async(t,e)=>{const{data:a,error:r}=await i.from("user_habits").update(e).eq("id",t).select().single();if(r)throw r;return a},D=async t=>{const{error:e}=await i.from("user_habits").delete().eq("id",t);if(e)throw e},k=async t=>{const{data:e,error:a}=await i.from("user_habits").select(`
            *,
            habit_collections (
                id,
                name
            )
        `).eq("user_id",t).order("created_at",{ascending:!0});if(a)throw a;return e},S=async t=>{const{data:e,error:a}=await i.from("habit_collections").select("*").eq("user_id",t).order("created_at",{ascending:!0});if(a)throw a;return e},v=async(t,e)=>{const{data:a,error:r}=await i.from("habit_collections").insert([{user_id:t,name:e}]).select().single();if(r)throw r;return a},M=async t=>{const{error:e}=await i.from("habit_collections").delete().eq("id",t);if(e)throw e},B=async(t,e,a)=>{const{data:r}=await i.from("habit_completions").select("id").eq("user_id",t).eq("habit_id",e).eq("date",a).maybeSingle();if(r){const{error:s}=await i.from("habit_completions").delete().eq("id",r.id);if(s)throw s;return!1}else{const{error:s}=await i.from("habit_completions").insert([{user_id:t,habit_id:e,date:a}]);if(s)throw s;return!0}},E=async(t,e,a)=>{const{data:r,error:s}=await i.from("habit_completions").select("*").eq("user_id",t).gte("date",e).lte("date",a);if(s)throw s;return r},L=async(t,e,a,r="all")=>{let s=i.from("user_habits").select("id",{count:"exact"}).eq("user_id",t);r!=="all"&&(r==="unassigned"?s=s.is("collection_id",null):s=s.eq("collection_id",r));const{data:c,count:o,error:l}=await s;if(l)throw l;if(o===0)return[];const d=c.map(n=>n.id),{data:_,error:m}=await i.from("habit_completions").select("date").eq("user_id",t).gte("date",e).lte("date",a).in("habit_id",d);if(m)throw m;const u={};return _.forEach(n=>{u[n.date]=(u[n.date]||0)+1}),Object.entries(u).map(([n,y])=>({date:n,score:Math.round(y/o*100)}))},j=async(t,e)=>{const{data:a,error:r}=await i.from("daily_metrics").select("*").eq("user_id",t).eq("date",e).maybeSingle();if(r)throw r;return a},O=async(t,e,a)=>{const{data:r,error:s}=await i.from("daily_metrics").select("*").eq("user_id",t).gte("date",e).lte("date",a).order("date",{ascending:!0});if(s)throw s;return r},T=async(t,e,a)=>{const{data:r,error:s}=await i.from("daily_metrics").upsert({user_id:t,date:e,screen_time_minutes:a},{onConflict:"user_id, date"}).select().single();if(s)throw s;return r};export{g as B,p as C,q as S,S as a,E as b,j as c,H as d,x as e,C as f,k as g,v as h,D as i,M as j,L as k,O as l,B as t,T as u};
