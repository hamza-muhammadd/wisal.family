import subprocess,uuid
A,B,C=[str(uuid.uuid4()) for _ in range(3)]
res=[]
def run(sql,uid=None,role='authenticated'):
    pre=f"set role {role}; select set_config('request.jwt.claim.sub','{uid or ''}',false); " if role!='postgres' else ''
    r=subprocess.run(['psql','-h','/tmp/pg','-p','5544','-U','postgres','-d','wt','-At','-q','-v','ON_ERROR_STOP=1','-c',pre+sql],capture_output=True,text=True)
    out=[l for l in r.stdout.strip().split('\n') if l and not l.startswith('set_config') and not l.startswith(uid or '#none')]
    # drop the set_config echo line
    lines=[l for l in r.stdout.strip().split('\n') if l]
    out=lines[1:] if (role!='postgres' and lines and lines[0]==(uid or '')) else ([] if (role!='postgres' and not lines) else lines)
    if role!='postgres' and lines and lines[0]!=(uid or ''): out=lines
    return r.returncode==0, ' '.join(out) if r.returncode==0 else r.stderr.strip().split('\n')[0]
def t(name,cond,extra=''): res.append((cond,name,extra)); 
S=lambda s:run(s,role='postgres')
S(f"insert into auth.users(id,email) values ('{A}','alice@x'),('{B}','bob@x'),('{C}','carol@x') on conflict do nothing")
# 1 alice creates household
ok,o=run(f"insert into family_data(user_id,data,invite_code) values ('{A}','{{\"v\":1}}','ABC123')",A); t('A1 alice creates her household row',ok,o)
ok,o=run(f"insert into family_data(user_id,data) values ('{B}','{{}}')",A); t('A2 alice cannot create a row for someone else',not ok,o)
ok,o=run(f"select count(*) from family_data",B); t('A3 bob (not joined) sees 0 rows',ok and o=='0',o)
ok,o=run(f"select count(*) from family_data where user_id='{A}'",C); t('A4 carol (stranger) sees 0 rows',ok and o=='0',o)
# join
ok,o=run("select join_household('abc123')",B); t('B1 bob joins with lower-case code',ok and o==A,o)
ok,o=run("select count(*) from family_data",B); t('B2 bob now sees alice\'s household',ok and o=='1',o)
ok,o=run(f"update family_data set data='{{\"v\":2}}' where user_id='{A}'",B); 
ok2,o2=run(f"select data->>'v' from family_data where user_id='{A}'",A); t('B3 bob can edit shared data (alice sees v=2)',ok and o2=='2',o2)
run(f"update family_data set invite_code='HACKED' where user_id='{A}'",B)
ok,o=S(f"select invite_code from family_data where user_id='{A}'"); t('B4 bob cannot change the invite code',o=='ABC123',o)
ok,o=run(f"delete from family_data where user_id='{A}'",B); ok2,o2=S("select count(*) from family_data"); t('B5 bob cannot delete alice\'s household',o2=='1',o2)
ok,o=run("select join_household('ABC123')",A); t('B6 owner using own code is rejected (own_code)',not ok and 'own_code' in o,o)
ok,o=run("select coalesce(join_household('ZZZZZZ')::text,'null')",C); t('B7 wrong code returns null',ok and o=='null',o)
ok,o=run(f"insert into family_members(member_id,household_id) values ('{C}','{A}')",C); t('B8 carol cannot add herself to a household directly',not ok,o)
ok,o=run("select join_household('abc123')",None,'anon'); t('B9 anonymous cannot call join_household',not ok,o)
# chat
ok,o=run(f"insert into family_messages(household_id,author,body) values ('{A}','Bob','hello')",B); t('C1 member bob posts a message (user_id defaults to him)',ok,o)
ok,o=run(f"insert into family_messages(household_id,author,body) values ('{A}','Carol','hi')",C); t('C2 stranger carol cannot post',not ok,o)
ok,o=run(f"select count(*) from family_messages",C); t('C3 stranger sees 0 messages',ok and o=='0',o)
ok,o=run(f"insert into family_messages(household_id,user_id,author,body) values ('{A}','{A}','Alice','spoof')",B); t('C4 bob cannot post as alice',not ok,o)
ok,mid=S("select id from family_messages limit 1")
run(f"update family_messages set body='edited by alice', reactions='{{\"+1\":[1]}}' where id={mid}",A)
ok,o=S(f"select body||'|'||reactions::text from family_messages where id={mid}"); t('C5 alice can react to bob\'s message but NOT rewrite it',o.startswith('hello|') and '+1' in o,o)
run(f"update family_messages set body='bob edit' where id={mid}",B); ok,o=S(f"select body from family_messages where id={mid}"); t('C6 author bob can edit his own message',o=='bob edit',o)
ok,o=run(f"delete from family_messages where id={mid}",C); ok2,o2=S("select count(*) from family_messages"); t('C7 stranger cannot delete',o2=='1',o2)
ok,o=run(f"delete from family_messages where id={mid}",A); ok2,o2=S("select count(*) from family_messages"); t('C8 household owner can remove a message',o2=='0',o2)
# reads
ok,o=run(f"insert into family_reads(household_id,user_id,last_seen_id) values ('{A}','{B}',5) on conflict (household_id,user_id) do update set last_seen_id=excluded.last_seen_id",B); t('D1 bob stores his read marker (upsert)',ok,o)
ok,o=run(f"insert into family_reads(household_id,user_id,last_seen_id) values ('{A}','{A}',9)",B); t('D2 bob cannot write alice\'s read marker',not ok,o)
ok,o=run("select count(*) from family_reads",C); t('D3 stranger sees no read markers',ok and o=='0',o)
# anon
for tb in ['family_data','family_members','family_messages','family_reads','subscriptions','ai_usage']:
    ok,o=run(f"select count(*) from {tb}",None,'anon'); t(f'E anon blocked from {tb}',not ok,o)
ok,o=run("select count(*) from ai_usage",A); t('E7 signed-in users cannot read ai_usage',not ok,o)
# subscriptions
S(f"insert into subscriptions(user_id,tier,status) values ('{A}','plus','active')")
ok,o=run("select count(*) from subscriptions",A); t('F1 alice sees her own subscription',ok and o=='1',o)
ok,o=run("select count(*) from subscriptions",B); t('F2 bob cannot see alice\'s subscription',ok and o=='0',o)
S(f"insert into subscriptions(user_id,tier,status) values ('{B}','free','inactive') on conflict do nothing")
run(f"update subscriptions set tier='plus', status='active' where user_id='{B}'",B)
ok,o=S(f"select tier||'/'||status from subscriptions where user_id='{B}'"); t('F3 users cannot self-upgrade (row stays free/inactive)',o=='free/inactive',o)
ok,o=run(f"delete from subscriptions where user_id='{B}'",B); ok2,o2=S(f"select count(*) from subscriptions where user_id='{B}'"); t('F3b users cannot delete their subscription row',o2=='1',o2)
ok,o=run(f"insert into subscriptions(user_id,tier,status) values ('{B}','plus','active')",B); t('F4 users cannot insert a subscription',not ok,o)
# ai limit
vals=[run(f"select ai_bump('{A}',2)",role='service_role')[1] for _ in range(3)]; t('G1 ai_bump counts 1,2 then blocks (-1)',vals==['1','2','-1'],str(vals))
ok,o=run(f"select ai_bump('{A}',2)",A); t('G2 browsers cannot call ai_bump',not ok,o)
# storage
ok,o=run(f"insert into storage.objects(bucket_id,name) values ('chat-media','{B}/p.png')",B); t('H1 bob uploads to his own folder',ok,o)
ok,o=run(f"insert into storage.objects(bucket_id,name) values ('chat-media','{A}/p.png')",B); t('H2 bob cannot upload into alice\'s folder',not ok,o)
ok,o=S("select public from storage.buckets where id='chat-media'"); t('H3 chat-media bucket exists and is public (app uses public URLs)',o=='t',o)
# leave + cascade
ok,o=run(f"delete from family_members where member_id='{B}'",B); ok2,o2=run("select count(*) from family_data",B); t('I1 bob leaves; loses access',ok and o2=='0',o2)
run("select join_household('ABC123')",B)
S(f"delete from auth.users where id='{A}'"); ok,o=S(f"select (select count(*) from family_data)||','||(select count(*) from family_members)||','||(select count(*) from subscriptions where user_id='{A}')"); t('I2 deleting alice\'s account removes her household, memberships, subscription',o=='0,0,0',o)
for c,n,e in res: print(('PASS' if c else 'FAIL'),'|',n,'|',('' if c else e))
print(sum(1 for c,_,_ in res if c),'/',len(res),'passed')
