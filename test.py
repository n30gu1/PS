import sys

N,M=map(int,input().split())
listN=[]
listM=[]
dbj=[]

for n in range(N):
    name=sys.stdin.readline().rstrip()
    listN.append(name)
for m in range(M):
    name=sys.stdin.readline().rstrip()
    listM.append(name)

listN.sort()
listM.sort()

i = 0
j = 0

while i < N and j < M:
    if listN[i] == listM[j]:
        dbj.append(listN[i])
        i += 1
        j += 1
    else:
        if listN[i] < listM[j]:
            i += 1
        else:
            j += 1

n=len(dbj)
print(n)
for j in dbj:
    print(j)