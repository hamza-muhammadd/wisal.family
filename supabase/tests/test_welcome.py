import subprocess,uuid
def S(sql,db='wt'):
    r=subprocess.run(['psql','-h','/tmp/pg','-p','5544','-U','postgres','-d',db,'-At','-q','-c',sql],capture_output=True,text=True); return r.returncode==0,(r.stdout.strip() if r.returncode==0 else r.stderr.strip().split('\n')[0])
res=[]
def t(n,c,e=''): res.append((c,n,e))
U=lambda:str(uuid.uuid4())
S("insert into vault.secrets_stub values ('wisal_welcome_secret','s3cret'),('wisal_welcome_url','https://x.supabase.co/functions/v1/wisal-welcome')")
# 1 confirm-email OFF: created already confirmed
a=U(); S(f"insert into auth.users(id,email,email_confirmed_at) values ('{a}','a@x',now())")
ok,o=S(f"select count(*) from welcome_emails where user_id='{a}'"); t('1 account created confirmed -> one welcome row',o=='1',o)
ok,o=S(f"select count(*) from net.calls where body->>'user_id'='{a}'"); t('2 -> exactly one webhook call',o=='1',o)
ok,o=S(f"select headers->>'x-webhook-secret'||'|'||url from net.calls where body->>'user_id'='{a}'"); t('3 call carries the shared secret + function URL',o=='s3cret|https://x.supabase.co/functions/v1/wisal-welcome',o)
# 2 retry / duplicate registration event
S(f"update auth.users set email_confirmed_at=now() where id='{a}'"); S(f"update auth.users set email_confirmed_at=now(), email='b@x' where id='{a}'")
ok,o=S(f"select count(*) from net.calls where body->>'user_id'='{a}'"); t('4 later updates never trigger a second email',o=='1',o)
# 3 confirm-email ON: unconfirmed at insert, confirmed later
b=U(); S(f"insert into auth.users(id,email) values ('{b}','c@x')")
ok,o=S(f"select count(*) from net.calls where body->>'user_id'='{b}'"); t('5 UNCONFIRMED account -> welcome goes out at once (with the confirmation email)',o=='1',o)
S(f"update auth.users set email_confirmed_at=now() where id='{b}'")
ok,o=S(f"select count(*) from net.calls where body->>'user_id'='{b}'"); t('6 confirming later does not send a second one',o=='1',o)
ph=U(); ok,o=S(f"insert into auth.users(id,email) values ('{ph}',null)"); ok2,o2=S(f"select count(*) from welcome_emails where user_id='{ph}'"); t('6b account without an email gets no welcome',ok and o2=='0',o2)
# 4 simulated duplicate insert of welcome row (retry) cannot create a second job
ok,o=S(f"insert into welcome_emails(user_id) values ('{b}')"); t('7 primary key blocks a duplicate job',not ok,o)
# 5 vault secrets missing -> sign-up must still succeed
S("delete from vault.secrets_stub")
c=U(); ok,o=S(f"insert into auth.users(id,email,email_confirmed_at) values ('{c}','d@x',now())"); t('8 missing secrets: sign-up still succeeds',ok,o)
ok,o=S(f"select status||'|'||last_error from welcome_emails where user_id='{c}'"); t('9 ...and the reason is recorded',o.startswith('failed|Vault secrets'),o)
# 6 pg_net raising -> sign-up must still succeed
S("insert into vault.secrets_stub values ('wisal_welcome_secret','s3cret'),('wisal_welcome_url','https://x/y')")
S("alter database wt set test.net_fail='on'")
d=U(); r=subprocess.run(['psql','-h','/tmp/pg','-p','5544','-U','postgres','-d','wt','-At','-q','-c',f"insert into auth.users(id,email,email_confirmed_at) values ('{d}','e@x',now())"],capture_output=True,text=True)
t('10 pg_net failure: sign-up still succeeds',r.returncode==0,r.stderr[:100])
ok,o=S(f"select status||'|'||last_error from welcome_emails where user_id='{d}'"); t('11 ...and marked failed with reason',o.startswith('failed|pg_net exploded'),o)
S("alter database wt reset test.net_fail")
# 7 privacy: browsers cannot read the table / call the trigger function
ok,o=S("set role authenticated; select count(*) from welcome_emails"); t('12 signed-in users cannot read welcome_emails',not ok,o)
ok,o=S("set role anon; select count(*) from welcome_emails"); t('13 anonymous cannot read welcome_emails',not ok,o)
ok,o=S("set role authenticated; select public.wisal_welcome_on_user()"); t('14 browsers cannot call the trigger function',not ok,o)
# 8 account deletion cascades
S(f"delete from auth.users where id='{a}'"); ok,o=S(f"select count(*) from welcome_emails where user_id='{a}'"); t('15 deleting the account removes its welcome row',o=='0',o)
for c_,n,e in res: print(('PASS' if c_ else 'FAIL'),'|',n,'|','' if c_ else e)
print(sum(1 for c_,_,_ in res if c_),'/',len(res),'passed')
