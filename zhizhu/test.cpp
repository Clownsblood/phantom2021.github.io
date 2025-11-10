#include <bits/stdc++.h>
using namespace std;
int f[1000010];
int vis[1000010];//统计每只猴子作为获胜者的次数
int a,b,m;
int main(){
	scanf("%d%d%d",&a,&b,&m);
	f[1] = 1;//当只有1只猴时，获胜者编号为1
	int ans = 0;
	for(int i = 1;i <= b;i++){
		f[i] = (f[i-1]+m-1)%i+1;
		if(i>=a){
			vis[f[i]]++;
			ans = max(ans,vis[f[i]]);
		}
	}
	printf("%d\n",ans);
	for(int i = 1;i <= b;i++){
		if(vis[i] == ans) printf("%d ",i);
	}
	return 0;
}