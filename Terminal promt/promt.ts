// for error handling
//npx tsc --noEmit --skipLibCheck

//for git commit and push
//git status
//git add .
//git commit -m "message"
//git push

//npm install
//npm run build


//i have recieve this errors in console from the port i have opened, auth is working for owner it directly let him to the "OwnerDashBoard" the page or what should i call it features or functions in that mainpage where most of the page(from the @page) for the page thats mainly assigned for management or for the owner "role to acess to or to direct to after loggin in. i just wanted to make things clear you can remove the config visuals that shows if api is present like the supabasestatus.ts and other config, next is that i noticed that the owner account with the owner role after loggin directs to OwnerDashboard.tsx which is newly made code but instead that was unncessary we can comeback and make the directory to OwnerHomepage.tsx which is derived from the older OwnerDashboard.tsx which currently exist in @page (theres 2 ownerDashboard.tsx there which is one is unnecessary. Next is about loading state or loading screen which is made if something like fetching of data from database or calling to an api is processing that will show up but for most pages like OwnerHomepage.tsx and other pages (other rpages that uses loading state or loading screen for fetching) because theres an issue like the OwnerHomepage.tsx where its content are for updates or visuals like charts, sales, expenses and other features/function it has instead of showing these it will only show loadng state which is frustrating, though i understand its fetching for the database but the account is newly made so it wont have some values in database which will cause the loading state to show up forever, which is why i wanted you to fix that up. and also regarding the Loadingstate or loadingscreen there is this page that covers the whole screen and showing authenticating verifying credentials...... even though i just refresh the browser i think the codes of that Loading State is messed up or used at the wrong time we can revome that and put the codes of that in preservedloadingstate for future uses but disable the functions as for the moment, for refreshing the browser just show the page to where or when the refresh occur (to not lose progress) cause sometimes i see it going back to Loginpage for this error i thnk you already understan it (the refresh in the browser which is very common in websites)
