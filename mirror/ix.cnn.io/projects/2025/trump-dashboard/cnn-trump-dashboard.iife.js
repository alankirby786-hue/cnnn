(function(){"use strict";function m(s,e,t,n=500,c=i=>i){const i=t-e;let r=null;function d(p){r||(r=p);const o=Math.min((p-r)/n,1),a=e+i*o;s.textContent=c(a),o<1&&requestAnimationFrame(d)}requestAnimationFrame(d)}function v(s,e){s.innerHTML=`
    <h2>${e}</h2>
    <div class="tile-content">
      <div class="tile-container">
        <div class="tile-price">
          <p class="cnnv-price">—</p>
        </div>
        <div class="tile-change">
          <p class="percent-change">—</p>
        </div>
      </div>
    </div>
  `,s.classList.remove("up","down")}function _(s,e){const t=s.querySelector(".cnnv-price"),n=s.querySelector(".percent-change"),c=parseFloat(t.textContent.replace(/,/g,""))||0,i=parseFloat(n.textContent.replace("%",""))||0,r=e.current_price,d=e.percent_change_from_prev_close*100,p=parseFloat(d.toFixed(2));m(t,c,r,800,a=>Math.round(a).toLocaleString()),m(n,i,p,800,a=>a.toFixed(2)+"%");const o=e.price_change_from_prev_close>0?"up":"down";s.classList.remove("up","down"),s.classList.add(o),n.classList.remove("up","down"),n.classList.add(o)}const l=new Set(["us-dow","us-sp500","us-nasdaq"]),u=new Date().toISOString().split("T")[0],h=s=>{const e=/(\$[0-9,]+(?:\.\d+)?)|(-?\d+(?:\.\d+)?%)/g;return s.replace(e,t=>`<span class="highlight">${t}</span>`)},w=async(s,e,t,n)=>{s.innerHTML=`
    <h2>US unemployment rate</h2>
    <div class="tile-content">
      <p class="blurb">${e.rate_desc}</p>
      <p class="statshot">${e.rate}%</p>
    </div>
  `},L=async(s,e,t,n)=>{s.innerHTML=`
    <h2>US CPI</h2>
    <div class="tile-content">
      <p class="blurb">${h(e.summary)}</p>
      <p class="statshot">${e.latestValue.toFixed(1)}%</p>
    </div>
  `},k=async(s,e,t,n)=>{s.innerHTML=`
    <h2>US GDP</h2>
    <div class="tile-content">
      <p class="blurb">${h(e.msg)}</p>
      <p class="statshot">${e.data[e.data.length-1].value.toFixed(1)}%</p>
    </div>
  `},S=async(s,e,t,n)=>{const c=e[0].price_change_from_prev_close>0?"up":"down";s.classList.add(c),s.innerHTML=`
    <h2>DOW</h2>
    <div class="tile-content">
      <div class="tile-container">
        <div class="tile-price">
          <p class="cnnv-price">${e[0].current_price.toLocaleString()}</p>
        </div>
        <div class="tile-change">
          <p class="${c}">
          ${(e[0].percent_change_from_prev_close*100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  `},f=async(s,e,t,n)=>{s.innerHTML=`
    <h2>US housing prices</h2>
    <div class="tile-content">
      <p class="blurb">${h(e.msg)}</p>
      <p class="statshot">$${e.data[e.data.length-1].value.toLocaleString()}</p>
    </div>
  `},b=async(s,e,t,n)=>{const c=e[1].price_change_from_prev_close>0?"up":"down";s.classList.add(c),s.innerHTML=`
    <h2>S&P 500</h2>
    <div class="tile-content">
      <div class="tile-container">
        <div class="tile-price">
          <p class="cnnv-price">${e[1].current_price.toLocaleString()}</p>
        </div>
        <div class="tile-change">
          <p class="${c}">
          ${(e[1].percent_change_from_prev_close*100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  `},y=async(s,e,t,n)=>{s.innerHTML=`
    <h2>Price of eggs</h2>
    <div class="tile-content">
      <p class="blurb">${e.priceSummary}</p>
      <p class="statshot">$${e.latestValue.toFixed(2)}</p>  
    </div>
  `},$=async(s,e,t,n)=>{const c=e[2].price_change_from_prev_close>0?"up":"down";s.classList.add(c),s.innerHTML=`
    <h2>NASDAQ</h2>
    <div class="tile-content">
      <div class="tile-container">
        <div class="tile-price">
          <p class="cnnv-price">${e[2].current_price.toLocaleString()}</p>
        </div>
        <div class="tile-change">
          <p class="${c}">${(e[2].percent_change_from_prev_close*100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  `},x=[{id:"us-unemployment",title:"US unemployment rate",endpoint:"https://ix.cnn.io/data/jobs-next/employment_situation_latest.json",render:w,source:"US Bureau of Labor Statistics",sourceLink:"https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm",targetLink:"https://www.cnn.com/2025/03/04/business/economy-state-outlook-dg?utm_source=trump-dashboard_unemployment"},{id:"us-cpi",title:"US CPI",endpoint:"https://ix.cnn.io/data/consumer-price-index/cpi.json",render:L,source:"U.S. Bureau of Labor Statistics",sourceLink:"https://data.bls.gov/timeseries/CUUR0000SA0&output_view=pct_12mths",targetLink:"https://www.cnn.com/2025/03/04/business/economy-state-outlook-dg?utm_source=trump-dashboard_cpi"},{id:"us-gdp",title:"Gross domestic product (GDP)",endpoint:"https://ix.cnn.io/data/gdp-change/real_gdp_quarterly_change.json",render:k,source:"US Bureau of Economic Analysis",sourceLink:"https://www.bea.gov/data/gdp/gross-domestic-product",targetLink:"https://www.cnn.com/2025/03/04/business/economy-state-outlook-dg?utm_source=trump-dashboard_gdp"},{id:"us-dow",title:"DOW Index",endpoint:`https://production.dataviz.cnn.io/markets/index/DJII-USA,SP500-CME,COMP-USA/${u}`,render:S,refreshInterval:10,source:"FactSet",sourceLink:"https://www.cnn.com/markets",targetLink:"https://www.cnn.com/markets?utm_source=trump-dashboard_dow"},{id:"us-housing",title:"US housing prices",endpoint:"https://ix.cnn.io/data/housing-prices/median_home_price_us_fred.json",render:f,source:"FRED",sourceLink:"https://fred.stlouisfed.org/series/MSPNHSUS",targetLink:"https://www.cnn.com/2025/03/04/business/economy-state-outlook-dg?utm_source=trump-dashboard_housing"},{id:"us-sp500",title:"S&P 500 Index",endpoint:`https://production.dataviz.cnn.io/markets/index/DJII-USA,SP500-CME,COMP-USA/${u}`,render:b,refreshInterval:10,source:"FactSet",sourceLink:"https://www.cnn.com/markets",targetLink:"https://www.cnn.com/markets?utm_source=trump-dashboard_sp500"},{id:"us-eggs",title:"Price of eggs",endpoint:"https://ix.cnn.io/data/inflation/eggs_latest.json",render:y,source:"US Bureau of Labor Statistics",sourceLink:"https://data.bls.gov/toppicks?survey=ap",targetLink:"https://www.cnn.com/2025/03/04/business/economy-state-outlook-dg?utm_source=trump-dashboard_eggs"},{id:"us-nasdaq",title:"NASDAQ Index",endpoint:`https://production.dataviz.cnn.io/markets/index/DJII-USA,SP500-CME,COMP-USA/${u}`,render:$,refreshInterval:10,source:"FactSet",sourceLink:"https://www.cnn.com/markets",targetLink:"https://www.cnn.com/markets?utm_source=trump-dashboard_nasdaq"}],g=async s=>{const e=document.getElementById(s.id);l.has(s.id)&&!e.dataset.initialized?(v(e,s.title),e.dataset.initialized="true"):l.has(s.id)||(e.innerHTML='<div class="loading">Loading…</div>');try{const t=await fetch(s.endpoint);if(!t.ok)throw new Error(t.statusText);const n=await t.json();if(l.has(s.id)){const c={"us-dow":0,"us-sp500":1,"us-nasdaq":2}[s.id];_(e,n[c])}else e.innerHTML="",s.render(e,n,s.source,s.sourceLink);s.targetLink&&(e.style.cursor="pointer",e.onclick=()=>{window.open(s.targetLink,"_blank")})}catch(t){e.innerHTML='<div class="error">Error loading</div>',console.error(`Tile [${s.id}] failed:`,t)}};(async()=>{x.forEach(s=>{g(s),s.refreshInterval&&setInterval(()=>g(s),s.refreshInterval*1e3)}),window._cbq&&Array.isArray(window._cbq)&&window._cbq.push(["track_links"])})()})();
