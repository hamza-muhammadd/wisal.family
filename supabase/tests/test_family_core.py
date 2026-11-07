import subprocess,uuid,json
res=[]
def run(sql,uid=None,role='authenticated'):
    cmd=['psql','-X','-h','/tmp/pg','-p','5544','-U','postgres','-d','wt','-At','-q','-v','ON_ERROR_STOP=1']
    if role!='postgres': cmd+=['-c',f"set role {role}",'-c',f"select set_config('request.jwt.claim.sub','{uid or ''}',false)"]
    cmd+=['-c',"select '<<<'",'-c',sql]
    r=subprocess.run(cmd,capture_output=True,text=True)
    if r.returncode!=0: return False,(r.stderr.strip().split('\n')[0] or '')
    out=r.stdout.split('<<<',1)[-1].strip(); return True,' '.join(l for l in out.split('\n') if l)
S=lambda s:run(s,role='postgres')
def t(n,c,e=''): res.append((bool(c),n,'' if c else str(e)))
def err(o,*words): return (not o[0]) and all(w in o[1] for w in words)
U=lambda:str(uuid.uuid4())
O,A,A2,D,T,C,G,X,Y,Z,W1,W2,W3,W4=[U() for _ in range(14)]
emails={O:'owner@x.co',A:'admin@x.co',A2:'admin2@x.co',D:'adult@x.co',T:'teen@x.co',C:'child@x.co',G:'guest@x.co',X:'x@x.co',Y:'y@x.co',Z:'z@x.co',W1:'w1@x.co',W2:'w2@x.co',W3:'w3@x.co',W4:'w4@x.co'}
for k,v in emails.items(): S(f"insert into auth.users(id,email,email_confirmed_at) values ('{k}','{v}',now())")
S("update plans set limits='{\"members\": 50}' where plan_key='free'")
ok,o=run(f"insert into family_data(user_id,data,invite_code,name,plan_key,member_limit) values ('{O}','{{\"fin\":1}}','OWN123','Hamza Family','premium',99)",O); t('0 owner creates the family',ok,o)
ok,o=S(f"select plan_key||'/'||coalesce(member_limit::text,'null') from family_data where user_id='{O}'"); t('L2 a browser cannot start on a paid plan or set its own limit',o=='free/null',o)
def invite(uid,role='adult',email='null',days=7,uses=1): return run(f"select code from create_invitation('{role}',{email},{days},{uses})",uid)
def join(uid,code): return run(f"select accept_invitation('{code}')",uid)
def role_of(uid): return run("select get_my_family()->>'role'",uid)[1]
# ---------- invitations ----------
ok,code=invite(O); t('T1 owner creates an invitation (10 character code)',ok and len(code)==10,code)
o=invite(X); t('T2 a person without a family cannot invite',err(o,'no_family'),o)
ok,o=join(X,code); t('T3 accepting makes the person an adult of that family',ok and o==O and role_of(X)=='adult',(o,role_of(X)))
o=join(Y,code); t('T4 a single-use invitation cannot be used twice',err(o,'invite_used'),o)
ok,c2=invite(O); S(f"update family_invitations set expires_at=now()-interval '1 minute' where code='{c2}'"); o=join(Y,c2); t('T5 expired invitation is refused',err(o,'invite_expired'),o)
ok,c3=invite(O); S(f"select 1"); ok2,idv=S(f"select id from family_invitations where code='{c3}'"); run(f"select revoke_invitation('{idv}')",O); o=join(Y,c3); t('T6 revoked invitation is refused',err(o,'invite_revoked'),o)
ok,c4=invite(O,'adult',"'z@x.co'"); o=join(Y,c4); t('T7a invitation tied to an email refuses another person',err(o,'wrong_email'),o)
ok,o=join(Z,c4); t('T7b ...and works for the right email',ok and o==O,o)
o=join(Y,'NOSUCHCODE'); t('T8 unknown code',err(o,'invite_invalid'),o)
ok,c5=invite(O); o=join(O,c5); t('T9 the owner cannot join their own family',err(o,'own_family'),o)
# fresh people for role tests
ok,ca=invite(O,'admin'); ok,o=join(A,ca); t('R0a owner invites an admin',ok and role_of(A)=='admin',role_of(A))
ok,ca2=invite(O,'admin'); join(A2,ca2)
for uid,r in ((D,'adult'),(T,'teen'),(C,'child'),(G,'guest')):
    ok,cc=invite(O,r); join(uid,cc)
t('R0b roles landed as invited',[role_of(u) for u in (D,T,C,G)]==['adult','teen','child','guest'],[role_of(u) for u in (D,T,C,G)])
o=invite(D,'adult'); t('T10a an adult cannot invite',err(o,'not_allowed'),o)
o=invite(A,'admin'); t('T10b an admin cannot invite another admin (owner only)',err(o,'owner_only'),o)
ok,mc=invite(O,'adult',"null",7,2); a=join(W1,mc); b=join(W2,mc); c=join(W3,mc); t('T11 a 2-use invitation works twice, then stops',a[0] and b[0] and err(c,'invite_used'),(a,b,c))
# ---------- what each role can read and write ----------
S("select 1")
ok,o=run("select count(*) from family_data",D); t('R1 adult reads the shared family data',o=='1',o)
run(f"update family_data set data='{{\"fin\":2}}' where user_id='{O}'",D); ok,o=S(f"select data->>'fin' from family_data where user_id='{O}'"); t('R1b adult can write it',o=='2',o)
for n,u in (('teen',T),('child',C),('guest',G)):
    ok,o=run("select count(*) from family_data",u); t(f'R2 {n} cannot read the shared data (finance, health ...) from the database',o=='0',o)
    run(f"update family_data set data='{{\"fin\":99}}' where user_id='{O}'",u); ok,o=S(f"select data->>'fin' from family_data where user_id='{O}'"); t(f'R2b {n} cannot write it',o=='2',o)
for n,u,expect in (('teen',T,True),('child',C,True),('guest',G,False),('adult',D,True)):
    ok,o=run(f"insert into family_messages(household_id,author,body) values ('{O}','{n}','hi from {n}')",u); t(f'R4 chat: {n} {"can" if expect else "cannot"} post',ok==expect,o)
ok,o=run("select count(*) from family_messages",G); t('R4b guest cannot read the chat',o=='0',o)
ok,o=run("select count(*) from family_messages",T); t('R4c teen reads the chat',o=='4' or int(o)>=3,o)
ok,o=run("select get_my_family()->>'name'||'|'||(get_my_family()->'can'->>'data.read')||'|'||(get_my_family()->'can'->>'chat.use')",T); t('R5 a teen still sees the family name and what they may do (no raw data)',o=='Hamza Family|false|true',o)
ok,o=run("select count(*) from family_invitations",T); t('R6a teen cannot list invitations',o=='0',o)
ok,o=run("select count(*) from family_invitations",A); t('R6b admin can list invitations',ok and int(o)>0,o)
# ---------- managing members ----------
o=run(f"select set_member_role('{T}','adult')",D); t('R7 an adult cannot change roles',err(o,'not_allowed'),o)
o=run(f"select set_member_role('{T}','adult')",T); t('R7b a teen cannot promote themselves',err(o,'not_allowed'),o)
o=run(f"select set_member_role('{D}','admin')",A); t('R8a an admin cannot create another admin',err(o,'owner_only'),o)
o=run(f"select set_member_role('{A2}','adult')",A); t('R8b an admin cannot demote another admin',err(o,'owner_only'),o)
ok,o=run(f"select set_member_role('{T}','adult')",A); ok2,o2=run("select count(*) from family_data",T); t('R8c an admin can change a teen into an adult (then they can read the data)',ok and o2=='1',(o,o2))
run(f"select set_member_role('{T}','teen')",A); ok,o=run("select count(*) from family_data",T); t('R8d ...and back (a new role starts from its defaults)',o=='0',o)
ok,o=run(f"select set_member_role('{D}','admin')",O); t('R9 the owner can promote to admin',ok and role_of(D)=='admin',role_of(D)); run(f"select set_member_role('{D}','adult')",O)
ok,o=run(f"select set_member_permissions('{T}','{{\"data.read\":true}}')",O); ok2,o2=run("select count(*) from family_data",T); t('R10a owner can widen one permission for one person',ok and o2=='1',(o,o2))
o=run(f"select set_member_permissions('{T}','{{\"members.manage\":true}}')",O); t('R10b management rights cannot be granted by override',err(o,'bad_permission'),o)
run(f"select set_member_permissions('{T}','{{}}')",O); ok,o=run("select count(*) from family_data",T); t('R10c clearing overrides returns to the role default',o=='0',o)
run(f"select set_member_permissions('{D}','{{\"chat.use\":false}}')",O); ok,o=run(f"insert into family_messages(household_id,author,body) values ('{O}','d','muted')",D); t('R10d an override can also take a permission away',not ok,o); run(f"select set_member_permissions('{D}','{{}}')",O)
# suspension
run(f"select set_member_status('{D}','suspended')",O)
ok,o=run("select count(*) from family_data",D); t('R11a suspended member loses the data',o=='0',o)
ok,o=run("select count(*) from family_messages",D); t('R11b ...and the chat',o=='0',o)
ok,o=run("select coalesce(get_my_family()::text,'none')",D); t('R11c ...and the family screen',o=='none',o)
o=run("select join_household('OWN123')",D); t('R11d ...and cannot sneak back in with the old code',err(o,'suspended'),o)
ok,cs=invite(O); o=join(D,cs); t('R11e ...or with a new invitation',err(o,'suspended'),o)
run(f"select set_member_status('{D}','active')",O); ok,o=run("select count(*) from family_data",D); t('R11f reactivated: access is back',o=='1',o)
# removal
ok,o=run(f"select remove_member('{G}')",D); t('R12a an adult cannot remove people',not ok,o)
ok,o=run(f"select remove_member('{G}')",A); ok2,o2=S(f"select count(*) from family_members where member_id='{G}'"); t('R12b an admin can remove a guest',ok and o2=='0',(o,o2))
ok,o=run(f"select remove_member('{C}')",C); ok2,o2=S(f"select count(*) from family_members where member_id='{C}'"); t('R12c anyone can leave',ok and o2=='0',(o,o2))
o=run(f"select remove_member('{A2}')",A); t('R12d an admin cannot remove another admin',err(o,'owner_only'),o)
# ---------- plans and limits ----------
run(f"update family_data set plan_key='premium', member_limit=50 where user_id='{O}'",O); ok,o=S(f"select plan_key||'/'||coalesce(member_limit::text,'null') from family_data where user_id='{O}'"); t('L1 the owner cannot upgrade the plan from the browser',o=='free/null',o)
ok,o=run("select count(*) from plans",D); t('L6a plans are readable',ok and int(o)==3,o)
run("update plans set limits='{\"members\": 1000}' where plan_key='free'",D); ok,o=S("select limits->>'members' from plans where plan_key='free'"); t('L6b but not changeable by users',o=='50',o)
cnt=int(S(f"select count(*) from family_members where household_id='{O}'")[1])+1
S(f"update plans set limits=jsonb_build_object('members',{cnt}) where plan_key='free'")
ok,cf=invite(O); o=join(W3,cf); t('L4a family at its plan limit: invitation refused (family_full)',err(o,'family_full'),o)
o=run("select join_household('OWN123')",W4); t('L4b ...and the old code too',err(o,'family_full'),o)
S(f"update family_data set plan_key='premium' where user_id='{O}'"); ok,o=join(W3,cf); t('L5 the server (billing) upgrades the plan, then joining works',ok and o==O,o)
cnt2=int(S(f"select count(*) from family_members where household_id='{O}'")[1])+1; S(f"update family_data set member_limit={cnt2} where user_id='{O}'"); ok,cg=invite(O); o=join(W4,cg); t('L7 a per-family override limit is respected',err(o,'family_full'),o)
S(f"update family_data set member_limit=null where user_id='{O}'")
# ---------- family profile ----------
run(f"update family_data set name='New Name', currency='BDT', country='Bangladesh' where user_id='{O}'",O); ok,o=S(f"select name||'/'||currency from family_data where user_id='{O}'"); t('P1a owner edits the family profile',o=='New Name/BDT',o)
run(f"update family_data set name='By Admin' where user_id='{O}'",A); ok,o=S(f"select name from family_data where user_id='{O}'"); t('P1b an admin can too',o=='By Admin',o)
run(f"update family_data set name='By Adult', currency='USD' where user_id='{O}'",D); ok,o=S(f"select name||'/'||currency from family_data where user_id='{O}'"); t('P1c an adult cannot (the shared data they may still edit)',o=='By Admin/BDT',o)
run(f"update family_data set invite_code='STOLEN' where user_id='{O}'",A); ok,o=S(f"select invite_code from family_data where user_id='{O}'"); t('P2 an admin cannot change the invite code',o=='OWN123',o)
for fn in ("get_my_family()","create_invitation('adult',null,7,1)","accept_invitation('X')","family_can('"+O+"','data.read')"):
    o=run(f"select {fn}",None,'anon'); t(f'P3 anonymous cannot call {fn.split("(")[0]}',not o[0],o)
ok,o=run("select count(*) from family_members",D); t('P4 an adult sees only their own membership row',ok and o=='1',o)
ok,o=run("select count(*) from family_members",A); t('P4b an admin sees the whole member list',ok and int(o)>=4,o)
S(f"delete from auth.users where id='{O}'"); ok,o=S("select (select count(*) from family_invitations)||','||(select count(*) from family_members)"); t('Z deleting the owner removes invitations and memberships',o=='0,0',o)
for c,n,e in res: print(('PASS' if c else 'FAIL'),'|',n,'|',e)
print(sum(1 for c,_,_ in res if c),'/',len(res),'passed')
