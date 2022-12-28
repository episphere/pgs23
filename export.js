// to inspect all data in the console
// dataObj=document.getElementById("PGS23calc").PGS23data

// This library was created before transitioning fully to ES6 modules
// Specifically the pgs library is a dependency satisfied by script tag loading
if (typeof (pgs) == 'undefined') {
    let s = document.createElement('script')
    s.src = 'https://episphere.github.io/pgs/pgs.js'
    document.head.appendChild(s)
}
if (typeof (JSZip) == 'undefined') {
    let s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
    document.head.appendChild(s)
}

if (typeof (Plotly) == 'undefined') {
    let s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/plotly.js/1.33.1/plotly.min.js'
    document.head.appendChild(s)
}

// pgs is now in the global scope, if it was not there already
// import * as zip from "https://deno.land/x/zipjs/index.js"

let PGS23 = {
    // a global variable that is not shared by export
    data: {}
}

// in case someone wants to see it in the console

PGS23.loadPGS = async(i=4)=>{
    // startng with a default pgs
    let div = PGS23.divPGS
    div.innerHTML = `<b style="color:maroon">A)</b> PGS # <input id="pgsID" value=${i} size=5> <button id='btLoadPgs'>load</button><span id="showLargeFile" hidden=true><input id="checkLargeFile"type="checkbox">large file (under development)</span> 
    <span id="summarySpan" hidden=true>[<a id="urlPGS" href='' target="_blank">FTP</a>][<a id="catalogEntry" href="https://www.pgscatalog.org/score/${"PGS000000".slice(0, -JSON.stringify(i).length) + JSON.stringify(i)}" target="_blank">catalog</a>]<span id="largeFile"></span><br><span id="trait_mapped">...</span>, <span id="dataRows">...</span> variants, [<a id="pubDOI" target="_blank">Reference</a>], [<a href="#" id="objJSON">JSON</a>].</span>
    <p><textarea id="pgsTextArea" style="background-color:black;color:lime" cols=60 rows=5>...</textarea></p>`;
    div.querySelector('#pgsID').onkeyup = (evt=>{
        if (evt.keyCode == 13) {
            div.querySelector('#btLoadPgs').click()
        }
    }
    )
    PGS23.pgsTextArea = div.querySelector('#pgsTextArea')
    div.querySelector('#btLoadPgs').onclick = async(evt)=>{
		document.querySelector('#summarySpan').hidden = true
        PGS23.pgsTextArea.value = '... loading'
        i = parseInt(div.querySelector('#pgsID').value)
        let PGSstr = i.toString()
        PGSstr = "PGS000000".slice(0, -PGSstr.length) + PGSstr
        div.querySelector('#urlPGS').href = `https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/${PGSstr}/ScoringFiles/Harmonized/`
        //check pgs file size
        let fsize = (await fetch(`https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/${PGSstr}/ScoringFiles/Harmonized/${PGSstr}_hmPOS_GRCh37.txt.gz`, {
            method: 'HEAD'
        })).headers.get('Content-Length');
        if ((fsize > 1000000)&(!div.querySelector('#checkLargeFile').checked)) {
			console.log('largeFile processing ...')
            //div.querySelector('#summarySpan').hidden = true
            let data = document.getElementById("PGS23calc").PGS23data
            if (data.pgs) {
                delete data.pgs
            }
            PGS23.pgsTextArea.value += ` ... whoa! ... this is a large PGS entry, over ${Math.floor(fsize / 1000000)}Mb. If you still want to process it please check "large file" above and press load again. Don't do this if you are not ready to wait ...`
            div.querySelector('#summarySpan').hidden = true
			div.querySelector('#showLargeFile').style.backgroundColor = 'yellow'
            div.querySelector('#showLargeFile').style.color = 'red'
			div.querySelector('#showLargeFile').hidden=false
			div.querySelector('#checkLargeFile').checked=false
            setTimeout(_=>{
                div.querySelector('#showLargeFile').style.backgroundColor = ''
                div.querySelector('#showLargeFile').style.color = ''
				//div.querySelector('#summarySpan').hidden = true
            }
            , 2000)
            //debugger
        } else {
			if(div.querySelector('#checkLargeFile').checked){
				PGS23.pgsTextArea.value=`... processing large file (this may not work, feature under development). If the wait gets too long, remember you can always reset by reloading the page.`
			}
			div.querySelector('#checkLargeFile').checked=false
			div.querySelector('#showLargeFile').hidden=true
            PGS23.pgsObj = await parsePGS(i)
            div.querySelector('#pubDOI').href = 'https://doi.org/' + PGS23.pgsObj.meta.citation.match(/doi\:.*$/)[0]
            div.querySelector('#trait_mapped').innerHTML = `<span style="color:maroon">${PGS23.pgsObj.meta.trait_mapped}</span>`
            div.querySelector('#dataRows').innerHTML = PGS23.pgsObj.dt.length
            if (PGS23.pgsObj.txt.length < 100000) {
                PGS23.pgsTextArea.value = PGS23.pgsObj.txt
            } else {
                PGS23.pgsTextArea.value = PGS23.pgsObj.txt.slice(0, 100000) + `...\n... (${PGS23.pgsObj.dt.length} variants) ...`
            }
            //PGS23.data.pgs=pgsObj
            const cleanObj = structuredClone(PGS23.pgsObj)
            cleanObj.info = cleanObj.txt.match(/^[^\n]*/)[0]
            delete cleanObj.txt
            PGS23.data.pgs = cleanObj
			div.querySelector('#summarySpan').hidden = false
        }
    };
    div.querySelector("#objJSON").onclick = evt=>{
        //console.log(Date())
        let cleanObj = structuredClone(PGS23.pgsObj)
        cleanObj.info = cleanObj.txt.match(/^[^\n]*/)[0]
        delete cleanObj.txt
        saveFile(JSON.stringify(cleanObj), cleanObj.meta.pgs_id + '.json')
    }
}

PGS23.load23 = async()=>{
    let div = PGS23.div23
    div.innerHTML = `<hr><b style="color:maroon">B)</b> Load your 23andMe data file: <input type="file" id="file23andMeInput">
	<br><span hidden=true id="my23hidden" style="font-size:small">
		 <span style="color:maroon" id="my23Info"></span> (<span id="my23variants"></span> variants) [<a href='#' id="json23">JSON</a>].
	</span>
	<p><textarea id="my23TextArea" style="background-color:black;color:lime" cols=60 rows=5>...</textarea></p>`
    div.querySelector('#file23andMeInput').onchange = evt=>{
        function UI23(my23) {
            // user interface
            div.querySelector("#my23hidden").hidden = false
            div.querySelector("#my23Info").innerText = my23.info
            div.querySelector("#my23variants").innerText = my23.dt.length
            div.querySelector("#json23").onclick = _=>{
                saveFile(JSON.stringify(my23), my23.info.replace(/\.[^\.]+$/, '') + '.json')
            }
            PGS23.data.my23 = my23
        }
        div.querySelector("#my23TextArea").value = '... loading'
        let readTxt = new FileReader()
        let readZip = new FileReader()
        readTxt.onload = ev=>{
            let txt = ev.target.result;
            div.querySelector("#my23TextArea").value = txt.slice(0, 10000).replace(/[^\r\n]+$/, '') + '\n\n .................. \n\n' + txt.slice(-300).replace(/^[^\r\n]+/, '')
            //let my23 = parse23(txt,evt.target.files[0].name)
            UI23(parse23(txt, evt.target.files[0].name))
        }
        // readZip.readAsArrayBuffer=async ev=>{
        readZip.onload = ev=>{
            let zip = new JSZip()
            zip.loadAsync(ev.target.result).then(zip=>{
                //txtFname=Object.keys(zip.files)[0]
                //console.log(zip.files,Date())
                //console.log(Object.getOwnPropertyNames(zip.files)[0])
                let fnametxt = Object.getOwnPropertyNames(zip.files)[0]
                zip.file(fnametxt).async('string').then(txt=>{
                    div.querySelector("#my23TextArea").value = txt.slice(0, 10000).replace(/[^\r\n]+$/, '') + '\n\n .................. \n\n' + txt.slice(-300).replace(/^[^\r\n]+/, '')
                    UI23(parse23(txt, evt.target.files[0].name))
                }
                )
                //debugger
            }
            )
            //debugger
            //await ev.arrayBuffer(x=>{
            //	debugger
            //})
            //let txt=await pako.inflate(ev.arrayBuffer(), { to: 'string' })
            //debugger
        }

        if (evt.target.files[0].name.match(/\.txt$/)) {
            readTxt.readAsText(evt.target.files[0])
        } else if (evt.target.files[0].name.match(/\.zip$/)) {
            readZip.readAsArrayBuffer(evt.target.files[0])
            //debugger
        } else {
            console.error(`wrong file type, neither .txt nor .zip: "${evt.target.files[0].name}"`)
        }
    }
}

PGS23.loadCalc = async()=>{
    let div = PGS23.divCalc
    div.innerHTML = `<hr>
	<b style="color:maroon">C)</b> Polygenic Risk Score (PRS)
	<p><button id="buttonCalculateRisk">Calculate Risk</button><span id="hidenCalc" hidden=true>
	[<a href="#" id="matchesJSON">matches</a>][<a href="#" id="riskCalcScoreJSON">calculation</a>]</span> <input id="progressCalc" type="range" value=0 hidden=false>
    </p>
	<textarea id="my23CalcTextArea" style="background-color:black;color:lime" cols=60 rows=5>...</textarea>
	<div id="plotRiskDiv"><div id="plotAllMatchByPosDiv">...</div><div id="plotAllMatchByEffectDiv">...</div></div>
	<hr><div>If you want to see the current state of the two data objects try <code>data = document.getElementById("PGS23calc").PGS23data</code> in the browser console</div><hr>
	<div id="tabulateAllMatchByEffectDiv"></div>
	`

    div.querySelector('#matchesJSON').onclick = evt=>{
        let data = document.getElementById("PGS23calc").PGS23data
        saveFile(JSON.stringify(data.pgsMatchMy23), data.my23.info.slice(0, -4) + '_match_PGS_calcRiskScore' + data.pgs.id + '.json')
    }
    div.querySelector('#riskCalcScoreJSON').onclick = evt=>{
        let data = document.getElementById("PGS23calc").PGS23data
        saveFile(JSON.stringify(data.calcRiskScore), data.my23.info.slice(0, -4) + '_individual_RiskScores' + data.pgs.id + '.json')
    }
    div.querySelector('#buttonCalculateRisk').onclick = evt=>{
        let hidenCalc = div.querySelector('#hidenCalc')
        let my23TextArea = div.querySelector('#my23CalcTextArea')
        my23CalcTextArea.value = '...'
        hidenCalc.hidden = true
        let data = document.getElementById("PGS23calc").PGS23data
        if (!data.pgs) {
            my23CalcTextArea.value += '\n... no PGS entry selected, please do that in A.'
        }
        if (!data.my23) {
            my23CalcTextArea.value += '\n... no 23andme report provided, please do that in B.'
        }
        if ((!!data.my23) & (!!data.pgs)) {
            my23CalcTextArea.value = `... looking for matches amongst the ${data.my23.dt.length} mutations targeted by 23andMe, for the reference ${data.pgs.dt.length} mutations reported in PGS#${data.pgs.id}, putatively associated with ${data.pgs.meta.trait_mapped}. \n...`
            document.querySelector('#buttonCalculateRisk').disabled = true
            document.querySelector('#buttonCalculateRisk').style.color = 'silver'
            data.pgsMatchMy23 = []
            PGS23.Match2(data)
        }
    }
}

/*
PGS23.Match = function (data,progressReport){
	// extract harmonized data from PGS entry first
	const indChr = data.pgs.cols.indexOf('hm_chr')
	const indPos = data.pgs.cols.indexOf('hm_pos')
	// match
	let dtMatch=[]
	const cgrInd = data.pgs.cols.indexOf('hm_chr')
	const posInd = data.pgs.cols.indexOf('hm_pos')
	const n = data.pgs.dt.length
	data.pgs.dt.forEach((r,i)=>{
		let dtMatch_i=data.my23.dt.filter(myr=>(myr[2]==r[indPos])).filter(myr=>(myr[1]==r[indChr]))
		if(dtMatch_i.length>0){
			dtMatch.push(dtMatch_i.concat([r]))
		}
		//console.log(i/n)
	})
	data.pgsMatchMy23=dtMatch
	let calcRiskScore =[]
	// calculate Risk
	let logR=0 // log(0)=1
	let ind_effect_allele=data.pgs.cols.indexOf('effect_allele')
	let ind_other_allele=data.pgs.cols.indexOf('other_allele')
	let ind_effect_weight=data.pgs.cols.indexOf('effect_weight')
	let ind_allelefrequency_effect=data.pgs.cols.indexOf('allelefrequency_effect')
	dtMatch.forEach((m,i)=>{
		calcRiskScore[i]=0 // default no risk
		let mi = m[0][3].match(/^[ACGT]{2}$/) // we'll only consider duplets in the 23adme report
		if(mi){
			//'effect_allele', 'other_allele', 'effect_weight'
			mi=mi[0] // 23andme match
			let pi=m.at(-1) //pgs match
			let alele=pi[ind_effect_allele]
			let L = mi.match(RegExp(alele,'g')) // how many, 0,1, or 2
			if(L){
				L=L.length
				calcRiskScore[i]=L*pi[ind_effect_weight]
			}
			//debugger
		}
	})
	data.calcRiskScore=calcRiskScore
	data.PRS = Math.exp(calcRiskScore.reduce((a,b)=>a+b))
	document.getElementById('my23CalcTextArea').value+=` Polygenic Risk Score, PRS=${Math.round(data.PRS*1000)/1000}, calculated from`
	//debugger
}
*/

PGS23.Match2 = function(data, progressReport) {
    // extract harmonized data from PGS entry first
    const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
    // match
    let dtMatch = []
    const cgrInd = data.pgs.cols.indexOf('hm_chr')
    const posInd = data.pgs.cols.indexOf('hm_pos')
    const n = data.pgs.dt.length
    let progressCalc = document.getElementById('progressCalc')
    progressCalc.hidden = false
    let i = 0
	let j = 0 //index of last match, the nex can match will have to be beyond this point since both pgs and 23and me are sorted by chr/position
    //let matchFloor=0 // to advance the earliest match as it advances
	function funMatch(i=0,matchFloor=0) {
        if (i < n) {
			let r = data.pgs.dt[i]
			if (dtMatch.length > 0){
				matchFloor=dtMatch.at(-1)[0][4]
				//console.log(matchFloor)
			}
            //let dtMatch_i = data.my23.dt.filter(myr=>(myr[2] == r[indPos])).filter(myr=>(myr[1] == r[indChr]))
			let dtMatch_i = data.my23.dt.slice(matchFloor).filter(myr=>(myr[2] == r[indPos])).filter(myr=>(myr[1] == r[indChr]))
            if (dtMatch_i.length > 0) {
                dtMatch.push(dtMatch_i.concat([r]))
            }
            progressCalc.value = 100 * i / n
            setTimeout(()=>{
                funMatch(i + 1)
            }
            , 0)
        } else {
            data.pgsMatchMy23 = dtMatch
            let calcRiskScore = []
            let aleles = []
            // calculate Risk
            let logR = 0
            // log(0)=1
            let ind_effect_allele = data.pgs.cols.indexOf('effect_allele')
            let ind_other_allele = data.pgs.cols.indexOf('other_allele')
            let ind_effect_weight = data.pgs.cols.indexOf('effect_weight')
            let ind_allelefrequency_effect = data.pgs.cols.indexOf('allelefrequency_effect')
            dtMatch.forEach((m,i)=>{
                calcRiskScore[i] = 0
                // default no risk
                aleles[i] = 0
                // default no alele
                let mi = m[0][3].match(/^[ACGT]{2}$/)
                // we'll only consider duplets in the 23adme report
                if (mi) {
                    //'effect_allele', 'other_allele', 'effect_weight'
                    mi = mi[0]
                    // 23andme match
                    let pi = m.at(-1)
                    //pgs match
                    let alele = pi[ind_effect_allele]
                    let L = mi.match(RegExp(alele, 'g'))
                    // how many, 0,1, or 2
                    if (L) {
                        L = L.length
                        calcRiskScore[i] = L * pi[ind_effect_weight]
                        aleles[i] = L
                    }
                    //debugger
                }
            }
            )
            data.aleles = aleles
			data.calcRiskScore = calcRiskScore
			if(calcRiskScore.reduce((a,b)=>Math.min(a,b))==0){//&&(calcRiskScore.reduce((a,b)=>Math.max(a,b))<=1)){ // hazard ratios?
				console.log('these are not betas :-(')
				document.getElementById('my23CalcTextArea').value += ` Found ${data.pgsMatchMy23.length} PGS matches to the 23andme report.`
				//document.getElementById('my23CalcTextArea').value += ` However, these don't look like betas. I am going to assume they are hazard ratios ... You could also look for another entry for the same trait where betas were calculated, maybe give it a try at https://www.pgscatalog.org/search/?q=${data.pgs.meta.trait_mapped.replace(' ','+')}.`
				document.getElementById('my23CalcTextArea').value += ` However, these don't look right, QAQC FAILED ! ... You could look for another entry for the same trait where betas pass QAQC, maybe give it a try at https://www.pgscatalog.org/search/?q=${data.pgs.meta.trait_mapped.replace(' ','+')}.`
				document.getElementById('plotRiskDiv').hidden=true
				document.getElementById('hidenCalc').hidden=false
				//plotHazardAllMatchByPos()
				//plotHazardAllMatchByEffect()
				plotAllMatchByEffect()
			}else{
				data.PRS = Math.exp(calcRiskScore.reduce((a,b)=>a + b))
	            document.getElementById('my23CalcTextArea').value += ` Polygenic Risk Score, PRS=${Math.round(data.PRS * 1000) / 1000}, calculated from ${data.pgsMatchMy23.length} PGS matches to the 23andme report.`
	            //my23CalcTextArea.value+=` ${data.pgsMatchMy23.length} PGS matches to the 23andme report.`
				document.getElementById('plotRiskDiv').hidden=false
	            document.getElementById('hidenCalc').hidden=false
	            //ploting
	            plotAllMatchByPos()
				plotAllMatchByEffect()
			}
			document.querySelector('#buttonCalculateRisk').disabled = false
			document.querySelector('#buttonCalculateRisk').style.color = 'blue'
        }

    }
    funMatch()

    /*
	data.pgs.dt.forEach((r,i)=>{
		let dtMatch_i=data.my23.dt.filter(myr=>(myr[2]==r[indPos])).filter(myr=>(myr[1]==r[indChr]))
		if(dtMatch_i.length>0){
			dtMatch.push(dtMatch_i.concat([r]))
		}
		//console.log(i/n)
	})
	 */

}

function ui(targetDiv=document.body) {
    // target div for the user interface
    //console.log(`prsCalc module imported at ${Date()}`)
    if (typeof (targetDiv) == 'string') {
        targetDiv = getElementById('targetDiv')
    }
    //console.log(pgs)
    let div = document.createElement('div')
    targetDiv.appendChild(div)
    div.id = 'prsCalcUI'
    div.innerHTML = `
    <p>
	Below you can select, and inspect, <b style="color:maroon">A)</b> the <a href='https://www.pgscatalog.org' target="_blank">PGS Catalog</a> entries with risk scores for a list of genomic variations; and <b style="color:maroon">B)</b> <a href="https://you.23andme.com/tools/data/download" target="_blank">Your 23andMe data download</a>. Once you have both (A) and (B), you can proceed to <b style="color:maroon">C)</b> to calculate your raw polygenic risk score for the trait targetted by the PGS entry.
    </p>
    <hr>
    `
    // recall that PGS23 is only global to the module, it is not exported
    PGS23.divPGS = document.createElement('div');
    div.appendChild(PGS23.divPGS)
    PGS23.div23 = document.createElement('div');
    div.appendChild(PGS23.div23)
    PGS23.divCalc = document.createElement('div');
    div.appendChild(PGS23.divCalc)
    PGS23.divCalc.id = "PGS23calc"
    PGS23.divCalc.PGS23data = PGS23.data
    // the more conventional alternative would be something like 
    // let divPGS = document.createElement('div');div.appendChild(divPGS)
    // let div23 = document.createElement('div');div.appendChild(div23)
    div.PGS23 = PGS23
    // mapping the module global variable to the UI ... discuss
    PGS23.div = div
    // for convenience, mapping the in multiple ways
    PGS23.loadPGS()
    PGS23.load23()
    PGS23.loadCalc()
}

async function parsePGS(i=4) {
    let obj = {
        id: i
    }
    obj.txt = await pgs.loadScore(i)
    let rows = obj.txt.split(/[\r\n]/g)
    let metaL = rows.filter(r=>(r[0] == '#')).length
    obj.meta = {
        txt: rows.slice(0, metaL)
    }
    obj.cols = rows[metaL].split(/\t/g)
    obj.dt = rows.slice(metaL + 1).map(r=>r.split(/\t/g))
    if (obj.dt.slice(-1).length == 1) {
        obj.dt.pop(-1)
    }
    // parse numerical types
    //const indInt=obj.cols.map((c,i)=>c.match(/_pos/g)?i:null).filter(x=>x)
    const indInt = [obj.cols.indexOf('chr_position'), obj.cols.indexOf('hm_pos')]
    const indFloat = [obj.cols.indexOf('effect_weight'), obj.cols.indexOf('allelefrequency_effect')]
    const indBol = [obj.cols.indexOf('hm_match_chr'), obj.cols.indexOf('hm_match_pos')]

    // /* this is the efficient way to do it, but for large files it has memory issues
    obj.dt = obj.dt.map(r=>{
        // for each data row
        indFloat.forEach(ind=>{
            r[ind] = parseFloat(r[ind])
        }
        )
        indInt.forEach(ind=>{
            r[ind] = parseInt(r[ind])
        }
        )
        indBol.forEach(ind=>{
            r[ind] = (r[11] == 'True') ? true : false
        }
        )
        return r
    }
    )
    // */
    // parse metadata
    obj.meta.txt.filter(r=>(r[1] != '#')).forEach(aa=>{
        aa = aa.slice(1).split('=')
        obj.meta[aa[0]] = aa[1]
        //debugger
    }
    )
    return obj
}

function parse23(txt, info) {
    // normally info is the file name
    let obj = {}
    let rows = txt.split(/[\r\n]+/g)
    let n = rows.filter(r=>(r[0] == '#')).length
    obj.meta = rows.slice(0, n - 1).join('\r\n')
    obj.cols = rows[n - 1].slice(2).split(/\t/)
    obj.dt = rows.slice(n)
    obj.dt = obj.dt.map((r,i)=>{
        r = r.split('\t')
        r[2] = parseInt(r[2])
        // position in the chr
		r[4]=i
        return r
    }
    )
    obj.info = info
    return obj
}

function saveFile(x, fileName) {
    // x is the content of the file
    // var bb = new Blob([x], {type: 'application/octet-binary'});
    // see also https://github.com/eligrey/FileSaver.js
    var bb = new Blob([x]);
    var url = URL.createObjectURL(bb);
    var a = document.createElement('a');
    a.href = url;
    if (fileName) {
        if (typeof (fileName) == "string") {
            // otherwise this is just a boolean toggle or something of the sort
            a.download = fileName;
        }
        a.click()
        // then download it automatically 
    }
    return a
}

// ploting

function plotAllMatchByPos(data=PGS23.data, div=document.getElementById('plotAllMatchByPosDiv')) {
	div.style.height='500px'
    const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
	let indOther_allele = data.pgs.cols.indexOf('other_allele')
	if(indOther_allele==-1){
		indOther_allele = data.pgs.cols.indexOf('hm_inferOtherAllele')
	}
	const indEffect_allele = data.pgs.cols.indexOf('effect_allele')
	const x = data.pgsMatchMy23.map(xi=>{
        return `Chr${xi.at(-1)[indChr]}.${xi.at(-1)[indPos]}:${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}
		<br> <a href="#" target="_blank">${xi[0][0]}</a>`
    }
    )
    const y = data.calcRiskScore
    const z = data.aleles
    const ii = [...Array(y.length)].map((_,i)=>i)
    let trace0 = {
        x: ii.map(i=>i+1),
        y: y,
		mode: 'markers',
		type: 'scatter',
		text: x,
		marker: { 
			size: 6,
			color:'navy',
			line:{
				color:'navy',
				width:1
			}
				}
    }
    div.innerHTML = ''
    Plotly.newPlot(div, [trace0],{
		//title:`${data.pgs.meta.trait_mapped}, PRS ${Math.round(data.PRS*1000)/1000}`
		title:`<i style="color:navy">${data.pgs.meta.trait_mapped} (PGP#${data.pgs.meta.pgs_id.replace(/^.*0+/,'')}), PRS ${Math.round(data.PRS*1000)/1000}</i>
			  <br><a href="${'https://doi.org/' + PGS23.pgsObj.meta.citation.match(/doi\:.*$/)[0]}" target="_blank"style="font-size:x-small">${data.pgs.meta.citation}</a>`,
		xaxis:{
			title:'variant sorted by chromossome and position',
			linewidth: 1,
			mirror: true,
			rangemode: "tozero"
		},
		yaxis:{
			title:'<span style="font-size:large">βz</span>, where <span style="font-size:small">PRS = exp(Σ β<sup>.</sup>z)</span>',
			linewidth: 1,
			mirror: true
		}
	})
    //debugger
}

function plotAllMatchByEffect(data=PGS23.data, div=document.getElementById('plotAllMatchByEffectDiv')) {
	div.style.height='500px'
    const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
	let indOther_allele = data.pgs.cols.indexOf('other_allele')
	if(indOther_allele==-1){
		indOther_allele = data.pgs.cols.indexOf('hm_inferOtherAllele')
	}
	const indEffect_allele = data.pgs.cols.indexOf('effect_allele')
	// sort by effect
	let jj = [...Array(data.calcRiskScore.length)].map((_,i)=>i)  // match indexes
	jj.sort((a,b)=>(data.calcRiskScore[a]-data.calcRiskScore[b]))
	//const x = data.pgsMatchMy23.map(xi=>{
	const x = jj.map(j=>{
		let xi = data.pgsMatchMy23[j]
		return `Chr${xi.at(-1)[indChr]}.${xi.at(-1)[indPos]}:${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}
		<br> <a href="#" target="_blank">${xi[0][0]}</a>`
    })
    const y = data.calcRiskScore
    const z = data.aleles
    const ii = [...Array(y.length)].map((_,i)=>i)
    let trace0 = {
        x: ii.map(i=>i+1),
        y: y.map((yi,i)=>y[jj[i]]),
		mode: 'lines+markers',
		type: 'scatter',
		text: x,
		marker: { 
			size: 6,
			color:'navy',
			line:{
				color:'navy',
				width:1
			}
		},
		line:{
			color:'navy'
		}
		
    }
    div.innerHTML = ''
    Plotly.newPlot(div, [trace0],{
		//title:`${data.pgs.meta.trait_mapped}, PRS ${Math.round(data.PRS*1000)/1000}`
		title:`<i style="color:navy">${data.pgs.meta.trait_mapped} (PGP#${data.pgs.meta.pgs_id.replace(/^.*0+/,'')}), PRS ${Math.round(data.PRS*1000)/1000}</i>
			  <br><a href="${'https://doi.org/' + PGS23.pgsObj.meta.citation.match(/doi\:.*$/)[0]}" target="_blank"style="font-size:x-small">${data.pgs.meta.citation}</a>`,
		xaxis:{
			title:'variant sorted by effect',
			linewidth: 1,
			mirror: true,
			rangemode: "tozero"
		},
		yaxis:{
			title:'<span style="font-size:large">βz</span>, where <span style="font-size:small">PRS = exp(Σ β<sup>.</sup>z)</span>',
			linewidth: 1,
			mirror: true
		}
	})

	// add table
	tabulateAllMatchByEffect()

	
    //debugger
}

function tabulateAllMatchByEffect(data=PGS23.data, div=document.getElementById('tabulateAllMatchByEffectDiv')) {
	if(!div){
		div = document.createElement('div')
		document.body.appendChild(div)
	}
	div.innerHTML=''
	// sort by absolute value
	let jj = [...Array(data.calcRiskScore.length)].map((_,i)=>i)  // match indexes
	let abs = data.calcRiskScore.map(x=>Math.abs(x))
	jj.sort((a,b)=>(abs[b]-abs[a])) // indexes sorted by absolute value
	// remove zero effect
	// jj = jj.filter(x=>abs[x]>0)
	// tabulate
	let tb = document.createElement('table')
	div.appendChild(tb)
	let thead = document.createElement('thead')
	tb.appendChild(thead)
	thead.innerHTML=`<tr><th align="left">#</th><th align="left">ß*z</th><th align="left">variant</th><th align="right">SNP</th><th align="left">edia</th><th align="left">aleles</th></tr>`
	let tbody = document.createElement('tbody')
	tb.appendChild(tbody)
	const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
	let indOther_allele = data.pgs.cols.indexOf('other_allele')
	if(indOther_allele==-1){
		indOther_allele = data.pgs.cols.indexOf('hm_inferOtherAllele')
	}
	const indEffect_allele = data.pgs.cols.indexOf('effect_allele')
	let n = jj.length
	jj.forEach((ind,i)=>{
		//let jnd=n-ind
		let row = document.createElement('tr')
		tbody.appendChild(row)
		let xi=data.pgsMatchMy23[ind]
		row.innerHTML=`<tr><td align="left">${ind+1}) </td><td align="left">${Math.round(data.calcRiskScore[ind]*1000)/1000}</td><td align="left" style="font-size:small;color:darkgreen"><a href="https://myvariant.info/v1/variant/chr${xi.at(-1)[indChr]}:g.${xi.at(-1)[indPos]}${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}" target="_blank">Chr${xi.at(-1)[indChr]}.${xi.at(-1)[indPos]}:g.${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}</a></td><td align="left"><a href="https://www.ncbi.nlm.nih.gov/snp/${xi[0][0]}" target="_blank">${xi[0][0]}</a><td align="left"><a href="https://www.snpedia.com/index.php/${xi[0][0]}" target="_blank">wiki</a></td><td align="center">${xi[0][3]}</td></tr>`
	})
	
	//debugger
}

// Hazard plots

/*

function plotHazardAllMatchByPos(data=PGS23.data, div=document.getElementById('plotAllMatchByPosDiv')) {
	div.style.height='500px'
    const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
	let indOther_allele = data.pgs.cols.indexOf('other_allele')
	if(indOther_allele==-1){
		indOther_allele = data.pgs.cols.indexOf('hm_inferOtherAllele')
	}
	const indEffect_allele = data.pgs.cols.indexOf('effect_allele')
	const x = data.pgsMatchMy23.map(xi=>{
        return `Chr${xi.at(-1)[indChr]}.${xi.at(-1)[indPos]}:${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}
		<br> <a href="#" target="_blank">${xi[0][0]}</a>`
    }
    )
    const y = data.calcRiskScore
    const z = data.aleles
    const ii = [...Array(y.length)].map((_,i)=>i + 1)
    let trace0 = {
        x: ii,
        y: y,
		mode: 'markers',
		type: 'scatter',
		text: x,
		marker: { 
			size: 8,
			color:'rgba(0,0,0,0)',
			line:{
				color:'navy',
				width:1
			}
				}
    }
    div.innerHTML = ''
    Plotly.newPlot(div, [trace0],{
		//title:`${data.pgs.meta.trait_mapped}, PRS ${Math.round(data.PRS*1000)/1000}`
		title:`<i style="color:navy">${data.pgs.meta.trait_mapped} (PGP#${data.pgs.meta.pgs_id.replace(/^.*0+/,'')}), PRS ${Math.round(data.PRS*1000)/1000}</i>
			  <br><a href="${'https://doi.org/' + PGS23.pgsObj.meta.citation.match(/doi\:.*$/)[0]}" target="_blank"style="font-size:x-small">${data.pgs.meta.citation}</a>`,
		xaxis:{
			title:'variant sorted by chromossome and position',
			linewidth: 1,
			mirror: true,
			rangemode: "tozero"
		},
		yaxis:{
			title:'<span style="font-size:large">βz</span>, where <span style="font-size:small">PRS = exp(Σ β<sup>.</sup>z)</span>',
			linewidth: 1,
			mirror: true
		}
	})
    //debugger
}

function plotHazardAllMatchByEffect(data=PGS23.data, div=document.getElementById('plotAllMatchByEffectDiv')) {
	div.style.height='500px'
    const indChr = data.pgs.cols.indexOf('hm_chr')
    const indPos = data.pgs.cols.indexOf('hm_pos')
	let indOther_allele = data.pgs.cols.indexOf('other_allele')
	if(indOther_allele==-1){
		indOther_allele = data.pgs.cols.indexOf('hm_inferOtherAllele')
	}
	const indEffect_allele = data.pgs.cols.indexOf('effect_allele')
	// sort by effect
	let jj = [...Array(data.calcRiskScore.length)].map((_,i)=>i)  // match indexes
	jj.sort((a,b)=>(data.calcRiskScore[a]-data.calcRiskScore[b]))
	const x = data.pgsMatchMy23.map(xi=>{
		return `Chr${xi.at(-1)[indChr]}.${xi.at(-1)[indPos]}:${xi.at(-1)[indOther_allele]}>${xi.at(-1)[indEffect_allele]}
		<br> <a href="#" target="_blank">${xi[0][0]}</a>`
    })
    const y = data.calcRiskScore
    const z = data.aleles
    const ii = [...Array(y.length)].map((_,i)=>i + 1)
    let trace0 = {
        x: ii,
        y: y.map((yi,i)=>y[jj[i]]),
		mode: 'lines+markers',
		type: 'scatter',
		text: x,
		marker: { 
			size: 6,
			color:'navy',
			line:{
				color:'navy',
				width:1
			}
		},
		line:{
			color:'navy'
		}
		
    }
    div.innerHTML = ''
    Plotly.newPlot(div, [trace0],{
		//title:`${data.pgs.meta.trait_mapped}, PRS ${Math.round(data.PRS*1000)/1000}`
		title:`<i style="color:navy">${data.pgs.meta.trait_mapped} (PGP#${data.pgs.meta.pgs_id.replace(/^.*0+/,'')}), PRS ${Math.round(data.PRS*1000)/1000}</i>
			  <br><a href="${'https://doi.org/' + PGS23.pgsObj.meta.citation.match(/doi\:.*$/)[0]}" target="_blank"style="font-size:x-small">${data.pgs.meta.citation}</a>`,
		xaxis:{
			title:'variant sorted by effect',
			linewidth: 1,
			mirror: true,
			rangemode: "tozero"
		},
		yaxis:{
			title:'<span style="font-size:large">βz</span>, where <span style="font-size:small">PRS = exp(Σ β<sup>.</sup>z)</span>',
			linewidth: 1,
			mirror: true
		}
	})
    //debugger
}
*/



export {ui, PGS23, parsePGS, parse23, plotAllMatchByPos,plotAllMatchByEffect}
