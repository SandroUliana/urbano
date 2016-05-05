$(function(){
	$("#linksMenu").listview();
	$("#Menu").panel();
	$(".BTNmapMenu").on("click",function(){$("#mapMenu").panel("open")})
	$(".BTNposMenu").on("click",function(){$("#posMenu").panel("open")})
	$(".BTNMenu").on("click",function(){$("#Menu").panel("open")})
	$(window).bind('beforeunload', function(){return 'Are you sure you want to leave?';});
	$(document).on("pagecontainershow",function(e,ui){
		if(ui.prevPage[0].id==ui.toPage[0]){console.log("ERRORE show!! "+PAG)}
		//else{
			var PAG=ui.toPage[0].id;
			//console.log("SHOW "+PAG)
			APP.USER.pagina=PAG
			APP.init.ALL()
			if($.isFunction(APP.init[PAG])){
				APP.init[PAG]()
				}
		//	}
		});	
	$(document).on("pagecontainerbeforechange",function(e,ui){
		if(typeof(ui.toPage)=="object"){
			//if(APP.ERRORE){
			//	ui.toPage[0]=$("#Errore")[0];
			//	$.extend(ui.options,{changeHash: false});
			//	}
			//else{
			if(typeof(ui.toPage)=="object"){
				if(ui.prevPage[0].id==ui.toPage[0]){console.log("ERRORE exit!! "+PAG)}	
				var PAG=ui.prevPage[0].id;
				//console.log("EXIT "+PAG)			
				if($.isFunction(APP.change[PAG])&&(PAG!=ui.toPage[0].id)){	
					APP.change[PAG]()
					}
				}
			//	}
			}
		});
	if(!APP.USER.logged){
		var COOKIE=APP.UTIL.cookie.get("URBANO")
		if(COOKIE){
			try{
				var CK=JSON.parse(COOKIE)
				APP.USER=CK.USER
				APP.ASSET=CK.ASSET
				APP.UTIL.getTabelle()
				APP.UTIL.go(CK.USER.pagina)
				}
			catch(e){
				console.log("Errore lettura cookie")
				}
			}
		}
	})
DEFAULT={
	ASSET:{			// asset di default
		REGISTRA:false,		// flag registrazione
		STATUS:false,			// 0=vuoto 1=attivo   2=completo	
		ACTUALMARK:false,		
		ACTUALPOS:false, 		//
		TOOL:false,
		IMGcount:0,
		Id:false,
		Rid:false,
		Lin:"",
		Data:moment().format("YYYY-MM-DD HH:mm:ss"),
		RidProp:false,
		Coordinate:false,
		Categoria:"",
		Tipologia:"",
		Dati:{},
		Immagini:[],
		Misure:{},
		Stato:{},
		//
		DatiOK:false,
		ImmaginiOK:false,
		MisureOK:false,
		StatoOK:false,
		MaxIndImg:0
		//
		},
	TOOL:{
		margin:85,
		orientation:false,
		width:false,
		height:false,
		ratio:false,
		marker:{
			dragging:false,
			orientation:false,
			A:0,
			B:0,
			length:0,
			pixel:false,
			cmpixel:false
			},
		asset:{
			orientation:false,
			A:0,
			B:0,
			length:0,
			pixel:false
			}
		}
	}
APP={
	//
	ERRORE:false,
	// TABELLE
	TABDATA:{},				// tabelle per selezioni				
	TAB:false, 				// tabella asset registrati dall'utente
	PREFERITI:[],		// tabella asset preferiti
	RECENTI:[],				// tabella asset recenti
	//

	// ################
	GETPOSITION:true,		// true in produzone
	// ################
	LAYER:"ALL",			// layer mappa principale			// dati utente
	SCHEDAID:false,			// scheda attuale
	TOOL:false,				// dati per tools
	ASSET:false,			// dati temporanei asset			
	USER:{
		logged:false,
		id:"",
		lin:"",
		token:false,
		task:"Urbano",
		pagina:"Login",
		expire:(moment().add(8,'hours').toDate()).toUTCString()
		},
	PARSE:{
		tab:function(RESULT){
			var TAB=[]
			if(RESULT!="" && RESULT.result.length>0){
				var GPSDATA={"Precisione":0,"Elevazione":0,"PrecisioneE":0}
				try{GPSDATA=(typeof(v.gps_data)=="string")?JSON.parse(v.gps_data.replace(/=/g,":")):v.gps_data}catch(e){}
				$.each(RESULT.result,function(i,v){
					try{
						TAB.push({
							Id:v.uuid,
							Data:v.created_at,
							Lin:v.lin,					
							Categoria:v.category,
							Tipologia:v.tipology,
							Coordinate:{
								Lat:parseFloat(v.wgs84_lat),
								Lng:parseFloat(v.wgs84_long),
								Precisione:GPSDATA.Precisione
								}
							})	
						}
					catch(e){
						APP.ERRORE="La tabella asset contiene errori formali"
						}
					})
				}

			return(TAB)
			},
		tabdata:function(RESULT){
			var TAB={}
			if(RESULT.result.length!=0){
				$.each(RESULT.result,function(i,v){
					if(v.category!="Urbobj"){
						if(!TAB[v.category]){
							TAB[v.category]={}
							}
						if(!TAB[v.category][v.type]){
							TAB[v.category][v.type]={}
							}					
						try{
							TAB[v.category][v.type]=JSON.parse(v.dataprop)
							TAB[v.category][v.type].Perimetro=(v.type=="Albero")?true:false
							TAB[v.category][v.type].Icona=(v.urlfile.indexOf("http")==-1)?"http://159.122.132.173/urbano/images/"+v.urlfile:v.urlfile
							}
						catch(e){
							APP.ERRORE="Il campo dataprop risulta essere vuoto o non valido"
							}
						}
					})
				}
			else{
				APP.ERRORE="La tabella metadati risulta essere vuota"
				}
			return(TAB)			
			},		
		scheda:function(Result,CALLBACK){
			RESULT=(Result.result)?Result.result:Result
			if(RESULT.length>0){
				var TAB={
					Id:false,
					Rid:false,
					Lin:false,
					Data:false,
					Coordinate:false,
					Categoria:false,
					Tipologia:false,
					Dati:{},
					Misure:{},
					Stato:{},
					DatiOK:false,
					MisureOK:false,
					StatoOK:false,
					MaxIndImg:0,
					Immagini:[],
					ImmaginiOK:false
					}
				TAB.Id=RESULT[0].uuid
				TAB.Rid=(RESULT[0]["@rid"]).substr(1)
				TAB.Lin=RESULT[0].lin
				TAB.Data=RESULT[0].created_at
				var GPSDATA={"Precisione":0,"Elevazione":0,"PrecisioneE":0}
				try{GPSDATA=(typeof(v.gps_data)=="string")?JSON.parse(v.gps_data.replace(/=/g,":")):v.gps_data}catch(e){}
				TAB.Coordinate={
					Lat:RESULT[0].wgs84_lat,
					Lng:RESULT[0].wgs84_long,
					Precisione:GPSDATA.Precisione,
					Elevazione:GPSDATA.Elevazione,
					PrecisioneE:GPSDATA.PrecisioneE
					},
				TAB.Categoria=RESULT[0].category
				TAB.Tipologia=RESULT[0].tipology
				if(RESULT[1]){
					TAB.RidProp=(RESULT[1]["@rid"]).substr(1)
					TAB.Dati 			=RESULT[1].Dati
					TAB.Misure 			=RESULT[1].Misure
					TAB.Stato 			=RESULT[1].Stato
					TAB.DatiOK 			=true
					TAB.MisureOK 		=true
					TAB.StatoOK 		=true
					if(RESULT[1].Immagini){
						TAB.ImmaginiOK 	=true
						var TOTIMG=0
						var IMGLOADED=0
						$.each(RESULT[1].Immagini,function(i,v){
							TOTIMG+=v.length
							$.each(v,function(ii,vv){
								var URL=((vv.indexOf("http")==-1)?'http://159.122.132.173/urbano':'')+vv
								var IND=parseInt(vv.substring(vv.lastIndexOf("_")+1,vv.lastIndexOf(".")))
								if(IND>TAB.MaxIndImg){TAB.MaxIndImg=IND}
								TAB.Immagini.push({
									indice:IND,
									tipo:i,
									src:URL,
									url:URL,
									orientation:1,
									stato:"old"
									})									
								})
							})
						}
					}
				$.each(TAB.Immagini,function(i,v){
					var img=document.createElement('img')
					img.onload = function(img){
						TAB.Immagini[this.alt].width=this.width
						TAB.Immagini[this.alt].height=this.height								
						}
					img.alt=i	
					img.src=v.src
					})
				CALLBACK(TAB)
				}
			}	
		},
	init:{
		ALL:function(){
			APP.UTIL.chk()
			APP.UTIL.cookie.set("URBANO",{"USER":APP.USER,"ASSET":APP.ASSET},false)
			},
		Home:function(){ // init
			
			//	
			DEFAULT.ASSET.Lin=APP.USER.lin
			//
			//
			if($.isEmptyObject(APP.TABDATA)){
				$("#POPmappaTitle").html("Attenzione")
				var str=''
				str+='<strong>La tabella dei metadati risulta essere vuota.</strong><br>'
				str+='Non &egrave possibile continuare, provare a ricaricare l&#39;applicazione'
				$("#POPmappaTxt").html(str)						
				$("#POPmappa").popup("open")
				}
			else{
				if(APP.GETPOSITION){
					navigator.geolocation.getCurrentPosition(function(position){
						APP.MAP.LAT=position.coords.latitude;
						APP.MAP.LNG=position.coords.longitude;					
						APP.MAP.ZOOM=10;
						APP.TAB=false
						APP.MAP.draw()
						},
						function(){
							APP.MAP.draw()
							var str=''
							str+='<strong>Il rilevamento di posizione risulta essere non attivo o non disponibile.</strong><br>'
							str+='Attivare la geolocalizzazione sul dispositivo o spostarsi in una zona con migliore ricezione del segnale GPS'
							$("#POPmappaTxt").html(str)						
							$("#POPmappa").popup("open")		
							},
						{timeout:10000})
					APP.GETPOSITION=false			
					}
				else{
					APP.MAP.draw()
					}
				}
			//APP.MAP.draw()
			//
			},
		Layer:function(){ // init
			var TABL=[];
			var str=''
			
			str+='<a href="javascript:APP.MAP.setLayer(false,false)" class="ui-btn ui-shadow ui-corner-all">Tutto</a>'
			str+='<div data-role="collapsibleset" data-theme="a" data-content-theme="a" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d">'
			$.each(APP.TABDATA,function(i,v){
				str+='<div data-role="collapsible"><h3>'+(i.replace(/_/g,' '))+'</h3>'
				str+='<a href="javascript:APP.MAP.setLayer(&quot;'+i+'&quot;,false)" class="ui-btn ui-shadow ui-corner-all">Tutto</a>'
				$.each(v,function(ii,vv){
					str+='<a href="javascript:APP.MAP.setLayer(&quot;'+i+'&quot;,&quot;'+ii+'&quot;)" class="ui-btn ui-shadow ui-corner-all">'+(ii.replace(/_/g,' '))+' <img style="width:15px;" src="'+APP.UTIL.getIcon(i,ii)+'"></a>'
					})
				str+='</div>'	
				})
			str+='</div>'
			$("#FieldsLayer").html(str)
			$('#Layer').trigger('create');
			},
		Aggiungi:function(){ // init	
			$("#btn-Dati,#btn-Misure,#btn-Posizione,#btn-Immagini,#btn-Stato,#btn-Registra").addClass("ui-disabled")
			APP.MAP.MAPPOS=false   		// riazzera mappa posizione
			APP.MAP.MARKERS=[]   		// riazzera i marker
			// copia asset default
			APP.ASSET=JSON.parse(JSON.stringify(DEFAULT.ASSET))
			// carica recenti
			APP.RECENTI=[]
			if(APP.TAB.length>0){
				for(var i=0;i<5&&i<APP.TAB.length;i++){APP.RECENTI.push(APP.TAB[i])}
				}
			// svuota select
			$("#SelectPreferiti").html('<option>Preferiti</option>').selectmenu("enable");
			$("#SelectRecenti").html('<option>Recenti</option>').selectmenu("enable");
			$("#SelectCategoria").html('<option>Categoria</option>').selectmenu("enable");
			$("#SelectTipologia").html('<option>Tipologia</option>').selectmenu("disable");		
			// carica select
			$.each(APP.PREFERITI,function(index,value){$("#SelectPreferiti").append('<option value="'+value.uuid+'">'+value.name+'</option>')})
			$.each(APP.RECENTI,function(index,value){
					$("#SelectRecenti").append('<option value="'+index+'">'+moment(value.Data).format("DD MMM YY HH:mm")+', '+moment(value.Data).fromNow()+'</option>')
					})
			for(var CAT in APP.TABDATA){if(CAT!="Dati"){
				a=0
				$("#SelectCategoria").append('<option value="'+CAT+'">'+CAT.replace(/_/," ")+'</option>')}
				}	
			// attiva e eventchange 
			$("#SelectPreferiti")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("Preferiti")});
			$("#SelectRecenti")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("Recenti")});
			$("#SelectCategoria")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("Categoria")});
			$("#SelectTipologia")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("Tipologia")});
			$("#SelectCategoriaP")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("CategoriaP")});
			$("#SelectTipologiaP")
				.selectmenu('refresh',true)
				.on("change",function(){doSelect("TipologiaP")});		
			function doSelect(SELECT){
				var val=$("#Select"+SELECT).val()
				if(SELECT=="Preferiti"){
					$("#SelectPreferiti").off("change")
					APP.UTIL.ajax("GET","urbano/api/bookmarks/"+val,"",function(RESULT){
						APP.PARSE.scheda(RESULT,function(S){
							APP.SCHEDA=S
							if(APP.SCHEDA){
								APP.ASSET=JSON.parse(JSON.stringify(APP.SCHEDA))
								APP.ASSET.Id=false
								APP.ASSET.Coordinate=false
								APP.ASSET.Perimetro=[]
								
								$.each(APP.ASSET.Immagini,function(i,v){APP.ASSET.Immagini[i].stato="copy"})
								APP.UTIL.go("Posizione")
								}					
							})
						},true)						
					APP.UTIL.go("Scheda")
					}
				else if(SELECT=="Recenti"){
					$("#SelectRecenti").off("change")
					for(OBJ in APP.RECENTI[val]){
						APP.ASSET[OBJ]=APP.RECENTI[val][OBJ]
						}
					$(".btn-Dati,.btn-Misure,.btn-Posizione,btn-Immagini,.btn-stato").removeClass("ui-disabled")
					APP.UTIL.go("Dati")
					}
				else if(SELECT=="Categoria"){
					$("#SelectPreferiti").selectmenu("disable");
					$("#SelectRecenti").selectmenu("disable");
					// svuota select categoria e tipologia
					$("#SelectTipologia").html('<option>Tipologia</option>')
					// mette il valore in asset
					APP.ASSET.Categoria=val
					// carica select tipologia
					for(var TIP in APP.TABDATA[val]){
						if(val!="Icona"){
							$("#SelectTipologia").append('<option value="'+TIP+'">'+TIP.replace(/_/," ")+'</option>')
							}
						}	
					// attiva select
					$("#SelectTipologia")
						.selectmenu('refresh', true)
						.selectmenu("enable");		
					}
				else if(SELECT=="Tipologia"){
					$("#SelectTipologia").off("change");						
					$("#SelectCategoria").off("change");						
					APP.ASSET.Tipologia=val
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Dati,function(index,value){APP.ASSET.Dati[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(index,value){APP.ASSET.Immagini[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure,function(index,value){APP.ASSET.Misure[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Stato,function(index,value){APP.ASSET.Stato[index]=false})
					// attiva i bottoni in menu
					$(".btn-Dati,.btn-Misure,.btn-Posizione,btn-Immagini,.btn-stato").removeClass("ui-disabled")
					console.log("SELECTED TIPOLOGIA")
					APP.UTIL.go("Dati")
					}
				}
			},
		Dati:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsDati").html(APP.UTIL.fields("Dati"))
			$('#Dati').trigger('create');
			},
		Immagini:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsImmagini").html(APP.UTIL.fields("Immagini"))
			$('#Immagini').trigger('create');
			$(".BTNimmagine").on("click",function(e){APP.IMAGE.click(e)})			
			$(".immagine").on("change",function(e){APP.IMAGE.get(e)})
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(index,value){APP.IMAGE.draw(index)})
			},
		Misure:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsMisure").html(APP.UTIL.fields("Misure"))			
			$('#Misure').trigger('create');
			},
		ToolMisure:function(){ // init
			if(APP.TOOL.field){
				APP.TOOL.init()
				}
			else{
				APP.UTIL.go("Misure")
				}
			},
		Stato:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsStato").html(APP.UTIL.fields("Stato"))			
			$('#Stato').trigger('create');
			},
		Posizione:function(){ // init	
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			APP.POS.init()
			},
		Registra:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			str=''
			if(APP.ASSET.STATUS){
				APP.ASSET.Data=moment().format("YYYY-MM-DD HH:mm:ss")
				str+='<div id="riepilogo">'
				str+='<div data-role="collapsibleset" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d">'
				str+='<div data-role="collapsible"><h3>Riepilogo</h3>'
				str+=APP.UTIL.drawScheda(APP.ASSET,"ASSET")
				str+='</div></div>'
				str+='<a href="javascript:APP.REGISTRA.go()" class="ui-btn ui-corner-all ui-shadow" id="BTNregistra">Registra</a>'
				str+='</div>'
				
				str+='<div id="ResultRegistra" style="display:none"  class="Registering">'
				str+='<div id="RegistraWait"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>'
				str+='</div>'
				str+='<div id="postRegistra" style="display:none">'
				str+='<a href="javascript:APP.REGISTRA.newPos()" class="ui-btn ui-corner-all ui-shadow" id="BTNaggiungiposizione">Aggiungi posizione</a>'
				str+='<a href="javascript:APP.REGISTRA.newAss()" class="ui-btn ui-corner-all ui-shadow" id="BTNnuovoasset">Nuovo asset</a>'
				str+='</div>'
				}
			else{
				str+='<div style="text-align:center"><div style="background:#f00;color:#fff;padding:10px;"><strong>L&#39;asset non può essere registrato!</strong></div>'
				str+='Occorre caricare i seguenti dati:</div>'
				if(!APP.ASSET.Coordinate && !APP.ASSET.Perimetro)	{str+='<a href="#Posizione" class="ui-btn ui-corner-all ui-shadow">Posizione</a>'}
				if(!APP.ASSET.DatiOK)		{str+='<a href="#Dati" 		class="ui-btn ui-corner-all ui-shadow">Dati</a>'}
				if(!APP.ASSET.ImmaginiOK)	{str+='<a href="#Immagini" 	class="ui-btn ui-corner-all ui-shadow">Immagini</a>'}
				if(!APP.ASSET.MisureOK)		{str+='<a href="#Misure" 	class="ui-btn ui-corner-all ui-shadow">Misure</a>'}
				if(!APP.ASSET.StatoOK)		{str+='<a href="#Stato" 	class="ui-btn ui-corner-all ui-shadow">Stato</a>'}
				}
			$("#FieldsRegistra").html(str)	
			$('#Registra').trigger('create');			
			},
		Scheda:function(){ // init
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsScheda").html("")
			if(APP.SCHEDA){
				APP.UTIL.ajax("GET","urbano/api/urbobjs/"+APP.SCHEDA.Id+"/all","",function(RESULT){
					APP.PARSE.scheda(RESULT,function(S){
						APP.SCHEDA=S
						if(!APP.SCHEDA){
							$("#BTNSdel,#BTNSedit,#BTNScopy,").addClass("ui-disabled")
							$("#FieldsScheda").html('<h1>La scheda dell&#39;asset &egrave; vuota o incompleta.</h1>')
							}
						else{
							$("#BTNSdel,#BTNSedit,#BTNScopy").removeClass("ui-disabled")						
							$("#FieldsScheda").html(APP.UTIL.drawScheda(APP.SCHEDA,"SCHEDA"))
							$(".IMGbox img").on("click",function(e){
								$("#POPschedaIMG").attr("src",APP.SCHEDA.Immagini[$(e.target).attr("data")].src)
								$("#POPschedaImage").popup("open")
								})
							$('#Scheda').trigger('create');
							}					
						})
					})			
				}
			},	
		Errore:function(){ // init
			$("#FieldsErrore").html(APP.ERRORE)			
			$('#Errore').trigger('create');
			}
		},
	change:{
		Aggiungi:function(){
			//$("#FieldsAggiungi").html("")
			},
		Layer:function(){ // change
			$("#FieldsLayer").html("")
			},
		Home:function(){ // change
			//$("#mappaGoogle").hide()
			},
		Dati:function(){ // change
			APP.ASSET.Dati={}
			$("#Dati input:text, #Dati input[type=number], #Dati input[type=radio]:checked,#Dati textarea").each(function(){
				APP.ASSET.Dati[$(this).attr('name')]=$(this).val()
				})
			// controllo campi obbligatori
			APP.ASSET.DatiOK=true						
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Dati,function(index,value){				
				if(APP.ASSET.DatiOK && value.req && APP.ASSET.Dati[index]==""){
					APP.ASSET.DatiOK=false
					}
				})
			//
			APP.UTIL.chk()
			$("#FieldsDati").html("")
			},
		Immagini:function(){ // change
			//APP.ASSET.Immagini=APP.IMMAGINI
			// controllo campi obbligatori
			APP.ASSET.ImmaginiOK=true			
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(index,value){
				if(APP.ASSET.ImmaginiOK && value.req){
					APP.ASSET.ImmaginiOK=false	
					$.each(APP.ASSET.Immagini,function(i,val){
						if(val.tipo==index){APP.ASSET.ImmaginiOK=true}
						})
					}
				})
			//			
			APP.UTIL.chk()
			$("#FieldsImmagini").html("")
			},
		Misure:function(){ // change		
			$("#Misure input:text, #Misure input[type=number], #Misure input[type=radio]:checked,#Misure textarea").each(function(){
				APP.ASSET.Misure[$(this).attr('name')]=$(this).val()				
				})
			// controllo campi obbligatori
			APP.ASSET.MisureOK=true						
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure,function(index,value){				
				if(APP.ASSET.MisureOK && value.req && APP.ASSET.Misure[index]==""){
					APP.ASSET.MisureOK=false
					}
				})
			//
			APP.UTIL.chk()
			$("#FieldsMisure").html("")
			},
		ToolMisure:function(){ // change
			APP.TOOL.field=false
			$("#FieldsToolMisure").html("")
			},
		Stato:function(){ // change		
			$("#Stato input:text, #Stato input[type=number], #Stato input[type=radio]:checked,#Stato textarea").each(function(){
				APP.ASSET.Stato[$(this).attr('name')]=$(this).val()				
				})
			// controllo campi obbligatori
			APP.ASSET.StatoOK=true						
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Stato,function(index,value){				
				if(APP.ASSET.StatoOK && value.req && APP.ASSET.Stato[index]==""){
					APP.ASSET.StatoOK=false
					}
				})
			//
			APP.UTIL.chk()
			$("#FieldsStato").html("")
			},
		Posizione:function(){ // change
			APP.POS.stopGps()
			$("#FieldsPosizione").html("")
			},
		Registra:function(){ // change
			/*
			if(APP.ASSET.REGISTRA){
				APP.ASSET.REGISTRA=false
				APP.UTIL.go("Aggiungi")	
				}
			*/
			$("#FieldsRegistra").html("")
			},
		Scheda:function(){ // change
			$("#FieldsScheda").html("")
			APP.SCHEDAID=false
			}
		},	
	UTIL:{
		doSelectP:function(){
			APP.ASSET.Categoria="Recinzione"
			APP.ASSET.Tipologia="Rete"
			APP.ASSET.Dati={}
			APP.ASSET.Immagini={}
			
			alert("ok")
			},
		getTabelle:function(){
			//APP.UTIL.ajax("GET","urbano/api/urbobj_metasP/","",function(RESULT){APP.TABPERI=APP.PARSE.tabperi(RESULT)},true)
       
			APP.UTIL.ajax("GET","urbano/api/urbobj_metas/","",function(RESULT){APP.TABDATA=APP.PARSE.tabdata(RESULT)},true)
			APP.UTIL.ajax("GET","/urbano/api/bookmarks",JSON.stringify({"lin":APP.USER.lin}),function(RESULT){APP.PREFERITI=(RESULT.result)?RESULT.result:RESULT},true)
			},
		go:function(PAG){ // util
			// console.log("GO TO #"+PAG)
			$("body").pagecontainer("change","#"+PAG);			
			},
		chk:function(){ // util		
			if( APP.ASSET.Categoria && APP.ASSET.Tipologia){$("#btn-Dati,#btn-Misure,#btn-Posizione,#btn-Immagini,#btn-Stato,#btn-Registra").removeClass("ui-disabled")}
			else{$("#btn-Dati,#btn-Misure,#btn-Posizione,#btn-Immagini,#btn-Stato,#btn-Registra").addClass("ui-disabled")}
			if( APP.ASSET.Coordinate ||  APP.ASSET.Perimetro &&
				APP.ASSET.Categoria  &&
				APP.ASSET.Tipologia  &&
				APP.ASSET.DatiOK       &&
				APP.ASSET.ImmaginiOK   &&
				APP.ASSET.MisureOK     &&
				APP.ASSET.StatoOK){
				APP.ASSET.STATUS=true;
				//$(".BTNsalva").removeClass("ui-disabled");
				}
			else{
				APP.ASSET.STATUS=false;
				//$(".BTNsalva").addClass("ui-disabled")
				}
			},
		ajaxOld:function(AJAX,DATA,SUCCESS){ // util
			$.ajax({
				type: "POST",
				url: "AJAX/"+AJAX,
				data: DATA,
				async:false,
				contentType: "application/x-www-form-urlencoded;charset=UTF-8",			
				dataType: "json",
				success: function(RESULT){
					if(RESULT.KO){
						if(RESULT.KO=="Fine sessione"){
							$("#messaggioLogin").html("<p>"+RESULT.KO+"</p>")	
							$("body").pagecontainer("change","#Login",{
								showLoadMsg: true
								});	
							}
						else{
							APP.messaggio("E","Si sono verificati errori")
							}
						}
					else{
						if(SUCCESS)SUCCESS(RESULT)
						}
					},
				error: function(A,B,C) {
					}
				});	
			},
		ajax:function(METHOD,AJAX,DATA,CALLBACK,SYNC){ // util
			$.ajax({
				"async":(SYNC)?false:true,
				"crossDomain": true,
				"url": "http://159.122.132.173/"+AJAX,
				"data":(DATA)?DATA:"",
				"method":(METHOD)?METHOD:"GET",
				"headers":{
					"authorization": "Bearer "+APP.USER.token,
					"accept": "-v1",
					"content-type": "application/json",
					"cache-control": "no-cache"
					},	
				success: function(RESULT){
					CALLBACK(RESULT)
					},
				error:function(x,s,e){
					CALLBACK({"ERRORE":"richiesta AJAX \n"+AJAX+"\n"+unescape(s)+" - "+unescape(e)})
					}
				});					
			},
		fields:function(PAG){ // util
			if(APP.ASSET.Categoria&&APP.ASSET.Tipologia){
				var str=''
				$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia][PAG], function(index,data){
					if(data.tipo=="txt"){
						str+='<input type="text" name="'+index+'" placeholder="'+data.caption.replace(/_/g,' ')+' '+(data.ex||'.')+'" '+((APP.ASSET[PAG][index])?' value="'+APP.ASSET[PAG][index]+'"':'')+'/>'
						}
					if(data.tipo=="cm"){
						str+='<div class="ui-grid-a"><div class="ui-block-a">'
						str+='<input type="number" name="'+index+'" placeholder="'+data.caption.replace(/_/g,' ')+' '+(data.ex||'.')+'" '+((APP.ASSET[PAG][index])?' value="'+APP.ASSET[PAG][index]+'"':'')+' />'
						str+='</div><div class="ui-block-b">'
						if(data.helper){
							str+='<a href="javascript:APP.TOOL.go(&quot;'+index+'&quot;,&quot;'+data.helper+'&quot;)" class="ui-shadow ui-btn ui-btn-inline ui-corner-all ui-icon-gear ui-btn-icon-notext"></a>'
							}
						str+='</div></div>'
						}
					if(data.tipo=="radio"){
						str+='<fieldset data-role="controlgroup" >'
						$.each(data.valori,function(i,opt){
							str+='<input type="radio" name="'+index+'" value="'+opt+'"  id="RADIO'+opt.replace(/\W/g,'')+'" '+((APP.ASSET[PAG][index]==opt||(APP.ASSET[PAG][index]!=opt&&i==0))?'checked="checked"':'')+' />'
							str+='<label for="RADIO'+opt.replace(/\W/g,'')+'">'+opt+'</label>'
							})
						str+='</fieldset>'
						}
					if(data.tipo=="textarea"){
						str+='<textarea style="height:200px" name="'+index+'" placeholder="'+data.caption.replace(/_/g,' ')+'">'+(APP.ASSET[PAG][index]||'')+'</textarea>'
						}
					if(data.tipo=="img"){
						str+='<button class="ui-btn ui-shadow ui-corner-all BTNimmagine" data="'+index+'">'+data.caption.replace(/_/g,' ')+'</button>'
						str+='<div style="width:0px;height:0px;overflow:hidden;"><input type="file" capture="camera" accept="image/*" id="'+index+'" class="immagine"></div>'
						str+='<div class="IMGimmagine" id="IMG'+index+'" style="margin:auto">'
						str+='</div>'
						}
					})
				return(str)		
				}
			},			
		drawScheda:function(S,TIPO){ // util
			str=''
			str+='<ul data-role="listview">'
			str+='<li><strong>UUID:</strong> '+S.Id+'<br><strong>Creato il:</strong> '+moment(S.Data).format("D MMMM YYYY HH:mm")+' ('+moment(S.Data).fromNow()+') <strong>Da:</strong>'+S.Lin+'<div id="noteScheda"></div></li>'
			str+='<li><strong>Asset:</strong> Cat:'+S.Categoria+' Tip:'+S.Tipologia+' <img src="'+APP.UTIL.getIcon(S.Categoria,S.Tipologia)+'"></li>'  // 
			str+='<li><strong>Posizione:</strong><br>Precisione: '+S.Coordinate.Precisione+'<br>Lat: '+S.Coordinate.Lat+'<br>Lng: '+S.Coordinate.Lng+'<br>Elev: '+S.Coordinate.Elevazione+'<br>Prec.Elev: '+S.Coordinate.PrecisioneE+'</li>'
			if(S.Dati){
				str+='<li><strong>Dati:</strong><br>'
				$.each(S.Dati,function(i,val){					
					str+=APP.UTIL.caption("Dati",i,TIPO)+'='+val+'<br>'
					})
				str+='</li>'
				}
			//
			if(S.Immagini){
				str+='<li style="padding-left:0.7em;white-space: normal;"><strong>Immagini:</strong><br> '
				$.each(S.Immagini,function(i,val){
					if(val.stato!="del"){
						str+='<div class="IMGbox">'
						str+='<img src="'+val.src+'" style="max-width:100px;max-height:100px;" data="'+i+'">'
						str+='<p>'+val.tipo+'</p>'
						str+='</div>'
						
						}
					})
				str+='</li>'
				}
			//
			if(S.Misure){
				str+='<li><strong>Misure:</strong><br> '
				$.each(S.Misure,function(i,val){
					str+=APP.UTIL.caption("Misure",i,TIPO)+'='+val+'<br>'
					})
				str+='</li>'
				}
			//
			if(S.Stato){
				str+='<li><strong>Stato:</strong><br> '
				$.each(S.Stato,function(i,val){
					str+=APP.UTIL.caption("Stato",i,TIPO)+'='+val+'<br>'
					})
				str+='</li>'
				}
			str+="</ul>"
			return(str)
			},
		getIcon:function(C,T){ // util
			return(
				(APP.TABDATA[C]&&APP.TABDATA[C][T]&&APP.TABDATA[C][T].Icona)?APP.TABDATA[C][T].Icona:
				(APP.TABDATA[C]&&APP.TABDATA[C].Icona)?APP.TABDATA[C].Icona:
				"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
				)
			},
		messaggio:function(TXT){ // util
			alert(TXT)
			},
		caption:function(PAG,IND,TIPO){ // util
			return((
				APP.TABDATA && 
				APP.TABDATA[APP[TIPO].Categoria] && 
				APP.TABDATA[APP[TIPO].Categoria][APP[TIPO].Tipologia] && 
				APP.TABDATA[APP[TIPO].Categoria][APP[TIPO].Tipologia][PAG][IND]&&
				APP.TABDATA[APP[TIPO].Categoria][APP[TIPO].Tipologia][PAG][IND].caption)?
				APP.TABDATA[APP[TIPO].Categoria][APP[TIPO].Tipologia][PAG][IND].caption:IND+"*")
			},
		findIndiceImg:function(TAB,IND){ // util
			var result=false
			$.each(TAB, function(i,v){			
				if(v.indice==IND){
					result=i
					}
				})
			return(result)			
			},
		cookie:{
			get:function(NOME){
				var name = NOME + "=";
				var ca = document.cookie.split(';');
				for(var i=0; i<ca.length; i++) {
					var c = ca[i];
					while (c.charAt(0)==' ') c = c.substring(1);
					if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
					}
				return "";
				},
			set:function(NOME,VALORE){
				document.cookie=(NOME+"="+JSON.stringify(VALORE)+";expires="+APP.USER.expire)  ;
				}			
			}			
		},
	IMAGE:{
		click:function(e){ // image
			$('#'+$(e.target).attr("data")).trigger('click');
			},
		get:function(e){ // image
			e.preventDefault();
			e=e.originalEvent;
			var target=e.dataTransfer||e.target;
			var tipo=$(target).attr("id");
			var file=target&&target.files&&target.files[0];
			var options={"canvas":true,"maxWidth":1000,"maxHeight":1000,"crossOrigin":true};
			var WW,HH,OO;
			try{
				loadImage.parseMetaData(file,function(data){
					if(data.exif){
						OO=data.exif.get('Orientation');
						options.orientation=OO;
						}
					loadImage(file,function(img){
						APP.ASSET.Immagini.push({
							tipo:tipo,
							width:img.width,
							height:img.height,
							src:img.toDataURL(),
							url:false,
							orientation:OO||1,
							indice:APP.ASSET.MaxIndImg+1,
							stato:"new"
							})
						APP.ASSET.MaxIndImg++	
						APP.IMAGE.draw(tipo)
						},options)
					});
				}
			catch(e){
				alert("L'immagine non è stata caricata, errore:"+e.message)
				}
			},
		draw:function(TIPO){ // image
			$("#POPimmagine").popup("close")
			$("#IMG"+TIPO).empty()
			var ii=0
			if(APP.ASSET.Immagini.length>0){
				IMGTIPO=0
				$.each(APP.ASSET.Immagini,function(i,v){if(v.tipo==TIPO&&v.stato!="del"){IMGTIPO++}})
				$.each(APP.ASSET.Immagini,function(i,v){
					if(v.tipo==TIPO&&v.stato!="del"){
						var NEWW=parseInt(($(".BTNimmagine").width()-(IMGTIPO*4))/IMGTIPO)
						if(NEWW<($(".BTNimmagine").width()/4)){NEWW=$(".BTNimmagine").width()/4}
						var NEWH=parseInt(NEWW/(v.width/v.height))
						//console.log("display="+NEWW+"x"+NEWH)
						$("#IMG"+TIPO).append($("<a>",{
							"href":'javascript:APP.IMAGE.popup('+i+',"'+TIPO+'")',
							"dim":v.width+"x"+v.height
							}).append($("<img>",{
								"src":v.src
								}).css({
									//"height":NEWH+"px",
									"width":NEWW+"px",							
									"margin":"2px",
									})
								)
							)						
						}
					})		
				}
			else{
				$("#BTNsalvaimmagini").addClass("ui-disabled")
				}			
			},
		remove:function(){ // image
			var IND=$("#imgPOPimmagine").attr("ind")
			var TIPO=$("#imgPOPimmagine").attr("tipo")
			if(APP.ASSET.Immagini[IND].stato=="new"){
				APP.ASSET.Immagini.splice(IND,1)
				}
			else{
				APP.ASSET.Immagini[IND].stato="del"
				}
			APP.IMAGE.draw(TIPO)			
			},
		rotate:function(){ // image
			var IND=$("#imgPOPimmagine").attr("ind")
			var TIPO=$("#imgPOPimmagine").attr("tipo")
			var v=APP.ASSET.Immagini[IND]
			if(v.orientation){
				var OO=(v.orientation==1)?8:(v.orientation==8)?6:(v.orientation==6)?3:(v.orientation==3)?1:1
				options={
					"orientation":OO,
					"canvas":true,
					"maxWidth":1000,
					"maxHeight":1000							
					}
				loadImage(v.src,function(img){
					var WW=v.width
					var HH=v.height
					APP.ASSET.Immagini[IND].width=HH
					APP.ASSET.Immagini[IND].height=WW
					APP.ASSET.Immagini[IND].src=img.src||img.toDataURL()
					APP.ASSET.Immagini[IND].orientation=OO
					if(APP.ASSET.Immagini[IND].stato!="new"){
						APP.ASSET.Immagini[IND].stato="edit"
						}
					APP.IMAGE.draw(TIPO)
					},options)
				}
			},
		popup:function(IND,TIPO){ // image
			if(APP.ASSET.Immagini[IND].stato=="old"){$("#BTNrotate").addClass("ui-disabled")}
			if(APP.ASSET.Immagini[IND].stato=="copy"){$("#BTNrotate").addClass("ui-disabled")}
			$("#imgPOPimmagine").attr({
				"src":APP.ASSET.Immagini[IND].src,
				"ind":IND,
				"tipo":TIPO
				})
			$("#POPimmagine").popup("open")
			},
		popupClose:function(){ // image
			APP.IMAGE.draw($("#imgPOPimmagine").attr("tipo"))
			},
		},
	TOOL:{
		ind:false,
		field:false,
		tipo:false,		
		go:function(FLD,TIPO){ // tool
			APP.TOOL.field=FLD
			APP.TOOL.tipo=(TIPO=="verticale")?'V':'H'
			APP.TOOL.draggable=false
			APP.UTIL.go("ToolMisure")
			},
		init:function(){ // tool
			var str=''	
			str+='<div id="ToolMain" class="topOfPage" style="height:85px">'
			str+='   <div id="ToolMainText">Scegliere un immagine che contenga sia l&#39;<u>intera '+((APP.TOOL.TIPO=="V")?'altezza':'larghezza')+'</u> da misurare che l&#39;<u>intero marcatore</u> posizionato '+((APP.TOOL.TIPO=="V")?'verticalmente':'orizzontalmente')+'</div>'
			str+='	 <div id="ToolBtn"></div>'		
			str+='</div>'
			str+='<div style="width:100%;text-align:center;">'
			str+='<div id="ToolImage"></div></div>'
			$("#FieldsToolMisure").html(str)			
			if(APP.ASSET.Immagini.length>0){
				str=''
				str+='<div class="ui-grid-b">'
				str+='<div data-role="navbar" style="margin-top:5px;"><ul>'
				str+=(APP.ASSET.Immagini.length>1)?'<li><a href="javascript:APP.TOOL.change(1)"  >Precedente</a></li>':''
				str+='<li><a href="javascript:APP.TOOL.popup(true)">Accetta 0/5</a></li>'
				str+=(APP.ASSET.Immagini.length>1)?'<li><a href="javascript:APP.TOOL.change(-1)" >Successiva</a></li>':''
				str+='</ul></div>'
				str+='</div>'
				$("#ToolBtn").html(str)
				$("#ToolImage").append($("<div>",{"id":"Dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragMarkerA","class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragMarkerB","class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragAssetA" ,"class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragAssetB" ,"class":"dragger"}))
				$("#ToolImage").append($("<img>",{"id":"ToolIMG","indice":"1"}))
				$('#ToolMisure').trigger('create');
				APP.TOOL.change(-1)			
				}
			else{
				$("#ToolMain").html('<div style="padding:10px;background:#f00;color:#fff"><strong>Attenzione!</strong><br>Per utilizzare il tool per le misure occorre aver caricato almeno un immagine.</div>').show()
				}	
			},
		change:function(DIR){ // tool
			// trova il nuovo indice
			var IND=DIR+parseInt($("#ToolIMG").attr("indice"))					
			if(IND>APP.ASSET.Immagini.length-1){IND=0}
			if(IND<0){IND=APP.ASSET.Immagini.length-1}
			APP.TOOL.ind=IND
			// prende l'immagine
			var IMG=APP.ASSET.Immagini[IND]
			if(IMG.stato!="del"){
				// inizializzazione
				if(!IMG.TOOL){IMG.TOOL=JSON.parse(JSON.stringify(DEFAULT.TOOL))}
				// trova il ratio e nuove dimensioni in viewport			
				IMG.TOOL.ratio 	= Math.min($("#ToolMisure").width()/IMG.width,($("#ToolMisure").height()-(IMG.TOOL.margin+5))/IMG.height);
				IMG.TOOL.width	=parseInt(IMG.width*IMG.TOOL.ratio)
				IMG.TOOL.height	=parseInt(IMG.height*IMG.TOOL.ratio)
				//
				$("#ToolIMG").attr({ // Immagine
					"src":IMG.src,
					"indice":IND
					})
				$("#ToolImage").css({"margin-top":IMG.TOOL.margin+"px"})	
				$("#ToolImage, #ToolIMG, #Dragger").css({
					"width":IMG.TOOL.width+"px",
					"height":IMG.TOOL.height+"px"
					})
				if(IMG.TOOL.marker.pixel){
					var MK=100/IMG.TOOL.marker.cmpixel
					$("#Dragger").css({
						"background":"rgba(0, 0, 0, 0) url(/urbano/IMG/bgMarker.png) repeat scroll 0 0 / "+MK+"px "+MK+"px",
						})
					APP.TOOL.asset("A")	
					}
				}
			},
		popup:function(OPEN){ // tool
			if(OPEN){$("#POPmisure").popup("open")}
			else{$("#POPmisure").popup("close")}			
			},			
		initMarker:function(){ // tool
			with(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker){
				length=parseInt($("#markerLunghezza").val())||0
				orientation=$("input:radio[name ='markerOrientamento']:checked").val() 
				}
			if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.A==0){APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.A=(APP.ASSET.Immagini[APP.TOOL.ind].TOOL[(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure[APP.TOOL.field].helper=="verticale")?"height":"width"]/3)}
			if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.B==0){APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.B=((APP.ASSET.Immagini[APP.TOOL.ind].TOOL[(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure[APP.TOOL.field].helper=="verticale")?"height":"width"]/3)*2)}		
			APP.TOOL.marker("A")
			},
		marker:function(STAGE){ // tool
			$("#Dragger").css({"background":"none"})
			$("#dragAssetA,#dragAssetB").hide()
			var OO=APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.orientation
			APP.TOOL.popup(false)
			$("#subtitle").html("marker "+STAGE+" "+((STAGE=="A")?"1":"2")+"/4")
			$("#ToolMainText").html(
				'Spostare la riga <u>'+((STAGE=="A")?"rossa":"verde")+'</u> in corrispondenza della parte <u>'+
				((OO=="V")?(STAGE=="A")?'superiore':'inferiore':(STAGE=="A")?'sinistra':'destra')+					
				'</u> del marcatore'
				)
			$("#ToolBtn").html('<a href="javascript:APP.TOOL.'+((STAGE=="A")?'marker(&quot;B&quot;)':'saveMarker()')+'" class="ui-btn">Accetta Marker '+STAGE+'</a>')		
			$("#ToolBack").attr('href','javascript:'+((STAGE=="A")?'APP.UTIL.go("Misure")':'APP.TOOL.marker("A")'))					
			var offset = $("#ToolImage").offset();	
			$("#dragMarker"+STAGE).css({
				"width":(OO=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.width+"px":"0px",
				"height":(OO=="V")?"0px":APP.ASSET.Immagini[APP.TOOL.ind].TOOL.height+"px",
				"border-bottom":(OO=="V")?"2px dashed "+((STAGE=="A")?"#f00":"#AA0"):"none",
				"border-left":(OO=="V")?"none":"2px dashed "+((STAGE=="A")?"#f00":"#AA0"),
				"top":offset.top+((OO=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE]:0)+"px",
				"left":offset.left+((OO=="V")?0:APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE])+"px"
				}).show()
			if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[((STAGE=='A')?'B':'A')]!=0){
				$("#dragMarker"+((STAGE=='A')?'B':'A')).show()
				}
			APP.TOOL.draggable="#Dragger"			
			$(document).off("vmousedown vmousemove vmouseup",APP.TOOL.draggable)
			$(document).on("vmousedown",APP.TOOL.draggable, function(event){
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragging=true
				var POS=(OO=="V")?event.pageY:event.pageX
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragstart=POS
				event.preventDefault();
				});	
			$(document).on("vmousemove",APP.TOOL.draggable, function(event){
				if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragging){
					var POS=(OO=="V")?event.pageY:event.pageX
					var DIFF=POS-APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragstart//-offset[(OO=="V")?"top":"left"]
					if(DIFF>2||DIFF<2){
						var OFF=$("#dragMarker"+STAGE).offset()
						if(OO=="V")	{$("#dragMarker"+STAGE).css("top",OFF.top+DIFF+"px")}
						else					{$("#dragMarker"+STAGE).css("left",OFF.left+DIFF+"px")}
						APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE]=(OO=="V")?OFF.top+DIFF-offset.top:OFF.left+DIFF-offset.left
						APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragstart=POS
						}
					}
				event.preventDefault();
				});	
			$(document).on("vmouseup",APP.TOOL.draggable, function(event){
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragging=false
				event.preventDefault();
				});	
			},
		saveMarker:function(){ // tool
			with(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker){
				pixel=(Math.max(A,B)-Math.min(A,B))
				cmpixel=length/pixel
				}
			APP.TOOL.asset("A")
			$("#dragMarkerA,#dragMarkerB").hide()
			},
		asset:function(STAGE){ // tool
			if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.pixel){
				if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.A==0){APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.A=(APP.ASSET.Immagini[APP.TOOL.ind].TOOL[(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure[APP.TOOL.field].helper=="verticale")?"height":"width"]/3)}
				if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.B==0){APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.B=((APP.ASSET.Immagini[APP.TOOL.ind].TOOL[(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure[APP.TOOL.field].helper=="verticale")?"height":"width"]/3)*2)}		

				$("#Dragger").css({"background":"rgba(0, 0, 0, 0) url(/urbano/IMG/bgMarker.png) repeat scroll 0 0 / "+(100/APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.cmpixel)+"px "+(100/APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.cmpixel)+"px"})
				$("#dragMarkerA,#dragMarkerB").hide()
				var OO=(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure[APP.TOOL.field].helper=="verticale")?"V":"O"
				APP.TOOL.popup(false)
				if(APP.TOOL.draggable){$(document).off("vmousedown vmousemove vmouseup",APP.TOOL.draggable);APP.TOOL.draggable=false}
				$("#subtitle").html("asset "+STAGE+" "+((STAGE=="A")?"3":"4")+"/4")
				$("#ToolMainText").html(
					'Spostare la riga <u>'+((STAGE=="A")?"rossa":"verde")+'</u> in corrispondenza della parte <u>'+
					((OO=="V")?(STAGE=="A")?'superiore':'inferiore':(STAGE=="A")?'sinistra':'destra')+					
					'</u> dell&#39;asset'
					)
				$("#ToolBtn").html('<a href="javascript:APP.TOOL.'+((STAGE=="A")?'asset(&quot;B&quot;)':'saveAsset()')+'" class="ui-btn">Accetta Asset '+STAGE+'</a>')		
				$("#ToolBack").attr('href','javascript:'+((STAGE=="A")?'APP.TOOL.marker("B")':'APP.TOOL.asset("A")'))					
				var offset = $("#ToolImage").offset();	
				$("#dragAsset"+STAGE).css({
					"width":(OO=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.width+"px":"0px",
					"height":(OO=="V")?"0px":APP.ASSET.Immagini[APP.TOOL.ind].TOOL.height+"px",
					"border-bottom":(OO=="V")?"2px dashed "+((STAGE=="A")?"#f00":"#AA0"):"none",
					"border-left":(OO=="V")?"none":"2px dashed "+((STAGE=="A")?"#f00":"#AA0"),
					"top":offset.top+((OO=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset[STAGE]:0)+"px",
					"left":offset.left+((OO=="V")?0:APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset[STAGE])+"px"
					}).show()
				if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset[((STAGE=='A')?'B':'A')]!=0){
					$("#dragAsset"+((STAGE=='A')?'B':'A')).show()
					}
				APP.TOOL.draggable="#Dragger"			
				$(document).off("vmousedown vmousemove vmouseup",APP.TOOL.draggable)
				$(document).on("vmousedown",APP.TOOL.draggable, function(event){
					APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragging=true
					var POS=(OO=="V")?event.pageY:event.pageX
					APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragstart=POS
					var OFF=$("#dragAsset"+STAGE).offset()			
					//console.log("start drag pos="+POS+" offset="+OFF.top)
					event.preventDefault();
					});	
				$(document).on("vmousemove",APP.TOOL.draggable, function(event){
					if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragging){
						var POS=(OO=="V")?event.pageY:event.pageX
						var DIFF=POS-APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragstart//-offset[(OO=="V")?"top":"left"]
						if(DIFF>2||DIFF<2){
							var OFF=$("#dragAsset"+STAGE).offset()
							if(OO=="V")	{$("#dragAsset"+STAGE).css("top",OFF.top+DIFF+"px")}
							else		{$("#dragAsset"+STAGE).css("left",OFF.left+DIFF+"px")}
							//console.log("drag pos="+POS+" differenza="+DIFF+" offset="+OFF.top)
							APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset[STAGE]=(OO=="V")?OFF.top+DIFF-offset.top:OFF.left+DIFF-offset.left
							APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragstart=POS
							}
						}
					event.preventDefault();
					});	
				$(document).on("vmouseup",APP.TOOL.draggable, function(event){
					APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.dragging=false
					event.preventDefault();
					});	
				}
			else{
				APP.TOOL.marker("A")
				}				
			},
		saveAsset:function(){ // tool					
			APP.ASSET.Misure[APP.TOOL.field]=Math.round(
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.cmpixel*(
					Math.max(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.A,APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.B)-
					Math.min(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.A,APP.ASSET.Immagini[APP.TOOL.ind].TOOL.asset.B))
				);
			APP.UTIL.go("Misure")
			},			
		},			
	REGISTRA:{
		go:function(){ // registra
			APP.ASSET.REGISTRA=true
			//
			$("#riepilogo,#BTNregistra").slideUp();
			$("#ResultRegistra").slideDown()
			//
			var adesso=new Date()
			var ISNEW=(APP.ASSET.Id)?false:true
			// costruisce l' asset da inviare
			var NEWASSET={
				uuid:APP.ASSET.Id,
				rid:APP.ASSET.Rid,
				// User:APP.USER.Lin,
				created_at:moment().format("YYYY-MM-DD HH:mm:ss"),
				wgs84_lat:APP.ASSET.Coordinate.Lat,
				wgs84_long:APP.ASSET.Coordinate.Lng,				
				gps_data:{
					Precisione:APP.ASSET.Coordinate.Precisione,
					Elevazione:APP.ASSET.Coordinate.Elevazione,
					PrecisioneE:APP.ASSET.Coordinate.PrecisioneE
					},			
				category:APP.ASSET.Categoria,
				tipology:APP.ASSET.Tipologia,
				urbobj_prop:{
					rid:APP.ASSET.RidProp,
					Dati:APP.ASSET.Dati,
					Misure:APP.ASSET.Misure,
					Stato:APP.ASSET.Stato				
					}
				}			
			// http://159.122.132.173/urbano/api/urbobjs NEWTAB
			// costruisce l' asset da aggiungere alla tabella dei marker
			NEWTAB={
				Id:NEWASSET.uuid,
				Data:NEWASSET.created_at,
				Lin:APP.USER.lin,
				Categoria:NEWASSET.category,
				Tipologia:NEWASSET.tipology,
				Coordinate:{
					Lat:parseFloat(NEWASSET.wgs84_lat),
					Lng:parseFloat(NEWASSET.wgs84_long),
					Precisione:NEWASSET.gps_data.Precisione
					}
				}

			APP.UTIL.ajax(((ISNEW)?"POST":"PUT"),"urbano/api/urbobjs/"+((ISNEW)?"":APP.ASSET.Id),JSON.stringify(NEWASSET),function(RESPONSE){
				if(RESPONSE.ERRORE){	
					$("#postRegistraWait").hide()
					$("#ResultRegistra").html("<strong>Si sono verificati errori:</strong><br>"+RESPONSE.ERRORE).show()																	
					}
				else{				
					APP.ASSET.Id=RESPONSE[0].uuid
					var RID=(RESPONSE[1].rid).replace(/#/g,'')
					$("#ResultRegistra").append('nuovo id registato:'+APP.ASSET.Id+'<div id="ImmaginiCaricate"><p>Attendere il caricamento delle immagini</p></div>')
					var LOADED=0
					var TOTLOAD=0
					var IMGERROR=""
					$.each(APP.ASSET.Immagini,function(i,v){
						if(v.stato!="old"){
							TOTLOAD++
							NEWFILES={
								"ind":v.indice,
								"prop":v.tipo,
								"uuid":APP.ASSET.Id,
								"rid":RID,
								"url":(v.stato=="copy"||v.stato=="del")?APP.ASSET.Immagini[i].url:false,
								"stato":v.stato,
								"base64":(v.stato=="copy"||v.stato=="del")?false:v.src
								}	
							APP.UTIL.ajax("POST","urbano/api/urbobj_props/"+RID+"/file-upload",JSON.stringify(NEWFILES),function(RESPONSE){
								if(RESPONSE.ERRORE||RESPONSE.stato=="failed"){
									$("#ImmaginiCaricate").append($("<div>",{"style":"color:#f00"}).text(v.tipo+" non caricata"))
									}
								else{
									var i=APP.UTIL.findIndiceImg(APP.ASSET.Immagini,RESPONSE.ind)
									if(i!==false){
										if(RESPONSE.stato=="deleted"){
											$("#ImmaginiCaricate").append($("<div>",{"style":"color:#fc0"}).text(RESPONSE.prop+"-"+RESPONSE.ind+" cancellata"))
											APP.ASSET.Immagini.splice(i,1)
											}
										else{
											$("#ImmaginiCaricate").append($("<div>",{"style":"color:#00f"}).text(RESPONSE.prop+"-"+RESPONSE.ind+" caricata"))										
											var URL=((RESPONSE.url.indexOf("http")==-1)?'http://159.122.132.173/urbano':'')+RESPONSE.url
											APP.ASSET.Immagini[i].url=URL
											APP.ASSET.Immagini[i].stato="old"
											APP.ASSET.Immagini[i].src=URL
											}
										}
									}
								LOADED++
								})
							}
						})
					//
					var timeout=0
					var IMGLOADED=setInterval(function(){
						timeout++
						if(timeout>300||LOADED>=TOTLOAD){						
							if(ISNEW){
								NEWTAB.Id=APP.ASSET.Id
								APP.TAB.unshift(NEWTAB)
								APP.MAP.MAP=false 
								}
							clearInterval(IMGLOADED)
							$("#RegistraWait").hide()
							$("#ResultRegistra").delay(1000).slideUp("slow")
							$("#postRegistra").show()						
							}
						},500);					
					}
				}
			,true)					
			},
		newPos:function(){ // registra
			APP.ASSET.REGISTRA=false
			APP.ASSET.Coordinate=false
			APP.ASSET.Perimetro=[]
			
			$.each(APP.ASSET.Immagini,function(i,v){
				APP.ASSET.Immagini[i].stato="copy"
				if(!APP.ASSET.Immagini[i].url){
					APP.ASSET.Immagini[i].url="http://159.122.132.173/urbano/uploads/"+APP.ASSET.Id+"_"+v.tipo+"_"+v.indice+".png"
					}
				})
			APP.ASSET.Id=false			
			APP.UTIL.go("Posizione")
			},
		newAss:function(){ // registra
			APP.ASSET.REGISTRA=false
			APP.UTIL.go("Aggiungi")
			},
		},
	MAP:{
		GPSISON:false,
		MAP:false,				// mappa principale
		MAPPOS:false,			// mappa posizione
		WATCH:false,			// watch position
		MARKERS:[],				//
		MAPINFOW:false,			//
		LAT:41.896541,			// posizione default (colosseo)
		LNG:12.482232,			// posizione default (colosseo)
		ZOOM:10,				// zoom default
		SEARCHBOX:false,
		LAYER:{
			CAT:false,
			TIPO:false
			},
		ZOOMTYPE:"LAST",
		//	
		toggleGps:function(){
			if(APP.MAP.WATCH)	APP.MAP.stopWatch()
			else 				APP.MAP.startWatch()
			},
		initAutocomplete:function()	{ // map
			var input = document.getElementById('locationTextField');
			var autocomplete = new google.maps.places.Autocomplete(input);				
			},
		draw:function(){ // map 
			if(!APP.TAB){APP.UTIL.ajax("GET","urbano/api/urbobjs/","my_lat="+APP.MAP.LAT+"&my_long="+APP.MAP.LNG+"&zoom="+APP.MAP.ZOOM+((APP.MAP.LAYER.CAT)?"&category="+APP.MAP.LAYER.CAT:"")+((APP.MAP.LAYER.TIPO)?"&tipology="+APP.MAP.LAYER.TIPO:""),function(RESULT){APP.TAB=APP.PARSE.tab(RESULT)},true)}
			if(!APP.MAP.MAP){
				APP.MAP.MARKERS=[]	
				var coords=new google.maps.LatLng(APP.MAP.LAT,APP.MAP.LNG)
				APP.MAP.MAP = new google.maps.Map(document.getElementById('mappaGoogle'), {
					center: coords,
					tilt:0,
					disableDefaultUI: true,
					mapTypeControl: true,
					zoom: APP.MAP.ZOOM||15
					});				
				APP.MAP.MAP.setOptions({styles:[{stylers: [{ hue: "#2d5d84" },{ saturation: -20 }]},
					{featureType: "road",elementType: "geometry",stylers:[{lightness:100},{visibility: "simplified" }]},
					{featureType: "road",elementType: "labels",stylers:[{visibility:"on"}]},
					{featureType: "poi",elementType: "labels",stylers:[{visibility:"off"}]},
					{featureType: "transit",elementType: "labels",stylers:[{visibility:"off"}]}
					]});
				$("#mappaGoogle").show()
				$("body").append($("<input>",{"type":"text","id":"inputSearch","style":"margin-top:10px;height:30px;"}))
				APP.MAP.SEARCHBOX=new google.maps.places.SearchBox(document.getElementById('inputSearch'))
				APP.MAP.MAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('inputSearch'))
				APP.MAP.SEARCHBOX.addListener('places_changed',function(){
					
					var places = APP.MAP.SEARCHBOX.getPlaces();	
					if(places.length==0){return;}else{
						var bounds = new google.maps.LatLngBounds();
						if (places[0].geometry.viewport) {bounds.union(places[0].geometry.viewport);} 
						else{bounds.extend(places[0].geometry.location);}				
						APP.MAP.MAP.fitBounds(bounds);
						APP.MAP.reload()
						}
					})
			
				//
				/*
				if(!APP.MAP.SEARCHBOX){
					APP.MAP.SEARCHBOX=new google.maps.places.SearchBox(document.getElementById('locationTextField'))
					APP.MAP.SEARCHBOX.addListener('places_changed',function(){
						var places = APP.MAP.SEARCHBOX.getPlaces();	
						if(places.length==0){return;}else{
							var bounds = new google.maps.LatLngBounds();
							if (places[0].geometry.viewport) {bounds.union(places[0].geometry.viewport);} 
							else{bounds.extend(places[0].geometry.location);}
							APP.MAP.MAP.fitBounds(bounds);
							}
						})
					}
				*/
				// SPIDERFIER
				var oms = new OverlappingMarkerSpiderfier(APP.MAP.MAP);
				var iw = new google.maps.InfoWindow();
				oms.addListener('click', function(marker, event) {
					iw.setContent(marker.desc);
					iw.open(APP.MAP.MAP, marker);
					});
				if(APP.TAB.length>0){
					$.each(APP.TAB,function(IND,ASSET){
						var MARKER= new google.maps.Marker({
							position:{lat:ASSET.Coordinate.Lat,lng:ASSET.Coordinate.Lng},
							map: APP.MAP.MAP,							
							icon: APP.UTIL.getIcon(ASSET.Categoria,ASSET.Tipologia)	
							})
						var dataora=ASSET.Data.split(" ")
						MARKER.desc=//'ind:'+IND+'<br>'+
									'<a href="javascript:APP.MAP.scheda(&quot;'+ASSET.Id+'&quot;)" class="BTNmark">'+
									'Data: '+moment(ASSET.Data).format("D MMMM YYYY")+'<br>'+
									'Ora: '+moment(ASSET.Data).format("HH:mm:ss")+'<br>'+
									'Usr: '+ASSET.Lin+'<br>'+
									ASSET.Categoria+' / '+ASSET.Tipologia+'<br>'+
									'Lat:'+(ASSET.Coordinate.Lat.toFixed(6))+'<br>'+
									'Lng.'+(ASSET.Coordinate.Lng.toFixed(6))+
									'</a>';
						APP.MAP.MARKERS.push(MARKER)
						oms.addMarker(MARKER);							
						})
					if(APP.MAP.MARKERS.length>0){
						var markerCluster = new MarkerClusterer(APP.MAP.MAP,APP.MAP.MARKERS,{
							maxZoom:18,
							zoomOnClick:true,
							styles:[{
								url: 'IMG/cluster.png',
								height: 35,
								width: 35,
								anchor: [0, 0],
								textColor: '#ffffff',
								textSize: 10							
								}]
							})	
						APP.MAP.zoom(APP.MAP.MAP,APP.MAP.MARKERS)
						}
					window.setTimeout(function(){	
						APP.MAP.MAP.addListener('zoom_changed',function(){
							if(APP.MAP.MAPINFOW){APP.MAP.MAPINFOW.close()};
							APP.MAP.ZOOMTYPE="ALL"
							});
						},500);
					}
				else{ // xxx
					$("#POPmappaTitle").html("Attenzione")
					var str=[]
					str+='<strong>Nessun asset trovato in queste coordinate.</strong><br>'
					str+=(APP.MAP.LAYER.CAT||APP.MAP.LAYER.TIPO)?
						'Modificare o rimuovere il layer selezionato':
						'Aggiungere un asset oppure cambiare il livello di zoom e/o la posizione ed effettuare un refresh.';
					$("#POPmappaTxt").html(str)						
					//if(!APP.IMMAGINI[IND].orientation){$("#BTNrotate").addClass("ui-disabled")}
					$("#POPmappa").popup("open")							
					}
				}
			},
		lastCluster:function(CLUSTER){ // map
			a=CLUSTER
			b=a.clusters_[0].markers_[0]
			a.clusters_[0].markers_[0].setVisible(true)
			//c=b.position.lat()
			//b.position.lat()=c+0.001
			d=0
			},
		xerrPos:function(err){ // map
			APP.MAP.stopWatch()
			console.warn('ERROR(' + err.code + '): ' + err.message);
			$("#BTNusaPosizione").hide()
			$("#FieldsPosizione").html("<p>"+err.message+"</p>")
			},
		xstartWatch:function(){
			APP.MAP.WATCH = navigator.geolocation.watchPosition(APP.MAP.update,APP.MAP.errPos,{enableHighAccuracy:true/*,timeout:10000*/});								
			$("#TposGPS").text("GPS ON").css("color","green")
			},
		xstopWatch:function(){
			if(APP.MAP.WATCH){
				navigator.geolocation.clearWatch(APP.MAP.WATCH)
				APP.MAP.WATCH=false
				$("#TposGPS").text("GPS OFF").css("color","red")
				}			
			},		
		xupdate:function(pos){ // map
			APP.ASSET.ACTUALPOS={
				Precisione:parseFloat(pos.coords.accuracy),
				Lat:parseFloat(pos.coords.latitude),
				Lng:parseFloat(pos.coords.longitude),
				Elevazione:parseFloat(pos.coords.altitude),
				PrecisioneE:parseFloat(pos.coords.altitudeAccuracy)
				}		
			var latlon = new google.maps.LatLng(APP.ASSET.ACTUALPOS.Lat,APP.ASSET.ACTUALPOS.Lng)
			if(!APP.ASSET.ACTUALMARK){APP.ASSET.ACTUALMARK=new google.maps.Marker({
				position:latlon,
				map:APP.MAP.MAPPOS,
				icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
				})}
			else{APP.ASSET.ACTUALMARK.setPosition(latlon);}
			APP.MAP.MAPPOS.setCenter(latlon);
			var str=""
			var acc=APP.ASSET.ACTUALPOS.Precisione
			var colore=(acc<=10)?"060":(acc<=15)?"CC0":(acc<=20)?"F60":"F00"		
			//str+='<div style="background:#'+colore+';color:#fff;padding:5px">Prec.'+acc.toFixed(2)
			//str+=' Lat.'+APP.ASSET.ACTUALPOS.Lat.toFixed(5)+' '
			//str+=' Lng.'+APP.ASSET.ACTUALPOS.Lng.toFixed(5)+'</div>'
			//$("#FieldsPosizione").html(str)
			$("#TposGPS").text("GPS ON : Prec."+acc.toFixed(2))
			},
		xusaPos:function(){ // map
			if(APP.MAP.WATCH){
				// interrompe geolocazione
				APP.MAP.stopWatch()
				APP.MAP.zoom(APP.MAP.MAPPOS,APP.ASSET.ACTUALMARK)
				if(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Perimetro){
					APP.ASSET.Perimetro.push(APP.ASSET.ACTUALPOS)
					}
				else{
					APP.ASSET.Coordinate=APP.ASSET.ACTUALPOS
					} 				
				APP.UTIL.chk()	
				}
			else{
				APP.MAP.newPos()
				}
			},
		newPos:function(){ // map
			// cancella il marker
			if(APP.ASSET.ACTUALMARK) APP.ASSET.ACTUALMARK.setMap(null)		
			// attiva 
			google.maps.event.addListener(APP.MAP.MAPPOS,"click",function(event) {
				var lat = event.latLng.lat();
				var lng = event.latLng.lng();
				var latlng = new google.maps.LatLng(lat,lng)
				APP.ASSET.ACTUALPOS={
					Precisione:0,
					Lat:lat,
					Lng:lng,
					Elevazione:0,
					PrecisioneE:0
					}
				APP.ASSET.ACTUALMARK.setPosition(latlng);
				APP.ASSET.ACTUALMARK.setMap(APP.MAP.MAPPOS)
				//APP.MAPPOS.setCenter(latlng);
				//var str=""
				//str+='<div style="background:#060;color:#fff;padding:5px">Prec.Man. Lat.'+APP.ASSET.ACTUALPOS.Lat.toFixed(5)+' Lng.'+APP.ASSET.ACTUALPOS.Lng.toFixed(5)+'</div>'
				//$("#FieldsPosizione").html(str)
				google.maps.event.clearListeners(APP.MAP.MAPPOS,"click");
				APP.MAP.usaPos()
				});		
			},
		setLayer:function(CAT,TIPO){ // map
			$("#Home .subtitle").html("Layer "+((CAT)?CAT:"")+((TIPO)?((CAT)?", ":"")+TIPO:""))
			APP.TAB=false
			APP.MAP.LAYER={
				CAT:CAT,
				TIPO:TIPO
				}
			APP.MAP.MAP=false
			APP.UTIL.go("Home")
			},
		reload:function(){ // map
			$("#mapMenu").panel("close")
			APP.MAP.LAT=APP.MAP.MAP.center.lat()
			APP.MAP.LNG=APP.MAP.MAP.center.lng()
			var ZOOM=APP.MAP.MAP.getZoom()
			APP.MAP.ZOOM=(ZOOM<21)?ZOOM:20
			APP.TAB=false
			APP.MAP.MAP=false
			APP.GETPOSITION=false
			APP.init.Home()
			},
		fitZoom:function(){ // map
			$("#mapMenu").panel("close")
			APP.MAP.zoom(APP.MAP.MAP,[APP.MAP.MARKERS[0]])
			/*
			if(APP.MAP.ZOOMTYPE=="LAST" || APP.MAP.MAP.getZoom()>10){
				APP.MAP.zoom(APP.MAP.MAP,[APP.MAP.MARKERS[0]])			
				APP.MAP.ZOOMTYPE="ALL"
				}
			else{
				APP.MAP.zoom(APP.MAP.MAP,APP.MAP.MARKERS)			
				APP.MAP.ZOOMTYPE="LAST"			
				}
			*/		
			},
		zoom:function(MAPPA,MARKERS){ // map
			if(MARKERS.length>0){
				APP.MAP.BOUNDS = new google.maps.LatLngBounds();
				for(var i=0;i<MARKERS.length;i++){
					a=i
					b=MARKERS[i]
					APP.MAP.BOUNDS.extend(MARKERS[i].getPosition());
					}
				MAPPA.fitBounds(APP.MAP.BOUNDS);
				}
			},
		scheda:function(IND){ // map
			APP.SCHEDA={
				Id:IND
				}
			APP.UTIL.go("Scheda")
			}
		},
	POS:{
		PERIMETRO:false,
		POLYGON:false,
		WATCH:false, 		// gps attivo GPS
		CLICK:false, 		// click attivo
		POSITION:false, 	// posizione attuale (geloc)
		MARKER:false, 		// marker attuale
		MARKERS:[],			// tabella markers
		MAP:false, 			// mappa posizione
		AUTOCENTER:false,
		init:function(){
			// annulla il perimetro se esiste
			if(APP.POS.POLYGON)APP.POS.POLYGON.setMap(null);
			APP.POS.PERIMETRO=new google.maps.MVCArray
			// azzera la tabella dei markers
			APP.ASSET.POSITION=false
			APP.ASSET.MARKER=false
			APP.POS.PERIMETRO.MARKERS=[]			
			$("#BtnGps").removeClass("ui-disabled")
			$("#BtnCenter").addClass("ui-disabled")
			$("#BtnAdd").addClass("ui-disabled")
			$("#BtnSalva").addClass("ui-disabled")
			// crea la mappa POS
			APP.POS.MAP = new google.maps.Map(document.getElementById("mappaGeolocazione"),{
				center:new google.maps.LatLng(APP.MAP.LAT,APP.MAP.LNG) ,
				tilt:0,
				zoom:18,
				mapTypeId:google.maps.MapTypeId.HYBRID,
				disableDefaultUI: true,
				navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL}
				});
			// imposta il perimetro
			APP.POS.POLYGON=new google.maps.Polygon({
				strokeWeight: 3,
				fillColor: '#5555FF',
				editable: true
				});
			APP.POS.POLYGON.setMap(APP.POS.MAP);
			APP.POS.POLYGON.setPaths(new google.maps.MVCArray([APP.POS.PERIMETRO]));
			// crea i marker degli asset esistenti		
			if(APP.TAB.length>0){
				$.each(APP.TAB,function(IND,ASSET){
					new google.maps.Marker({
						position:{lat:ASSET.Coordinate.Lat,lng:ASSET.Coordinate.Lng},
						map: APP.POS.MAP,							
						icon:"http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_green.png"	
						})
					})
				}
			// casella di ricerca
			$("body").append($("<input>",{type:"text",id:"inputSearchP",style:"margin:10px 0px 0px 10px;height:30px;"}))
			APP.POS.SEARCHBOXP=new google.maps.places.SearchBox(document.getElementById('inputSearchP'))
			APP.POS.MAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('inputSearchP'))
			APP.POS.SEARCHBOXP.addListener('places_changed',function(){
				APP.POS.stopGps()
				var places = APP.POS.SEARCHBOXP.getPlaces();	
				if(places.length==0){return;}else{
					var bounds = new google.maps.LatLngBounds();
					if (places[0].geometry.viewport) {bounds.union(places[0].geometry.viewport);} 
					else{bounds.extend(places[0].geometry.location);}				
					APP.POS.MAP.fitBounds(bounds);
					//APP.POS.MAP.reload()
					}
				})
			// box testo gps
			APP.POS.messaggio("Toccare lo schermo o attivare il gps")
			$("body").append($("<div>",{id:"TposGPS"}))
			APP.POS.MAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('TposGPS'))
			//
			if(APP.ASSET.Id){ // se asset esistente crea oggetto e marker
				var latlon=new google.maps.LatLng(APP.POS.POSITION.Lat,APP.POS.POSITION.Lng)
				APP.POS.POSITION={ // coordinate dell'asset
					Precisione:APP.ASSET.Coordinate.Precisione,
					Lat:APP.ASSET.Coordinate.Lat,
					Lng:APP.ASSET.Coordinate.Lng,
					Elevazione:APP.ASSET.Coordinate.Elevazione,
					PrecisioneE:APP.ASSET.Coordinate.PrecisioneE,
					MARKER:new google.maps.Marker({
						position:latlon,
						map:APP.POS.MAP,
						draggable:true,
						icon:'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
						})
					}
				APP.POS.MAP.setCenter(latlon);
				}
			else{
				APP.POS.POSITION=false
				}
			APP.POS.manualOn()
			},
		update:function(pos){ // map		
			// prende la posizione attuale dal gps
			var latlon=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude)
			APP.POS.removeMarker()	
			APP.POS.POSITION={
				Precisione:parseFloat(pos.coords.accuracy),
				Lat:parseFloat(pos.coords.latitude),
				Lng:parseFloat(pos.coords.longitude),
				Elevazione:parseFloat(pos.coords.altitude),
				PrecisioneE:parseFloat(pos.coords.altitudeAccuracy),
				MARKER:new google.maps.Marker({
					position:latlon,
					map:APP.POS.MAP,
					icon: {
						url: '/IMG/ICON/center-red.png',
						anchor: new google.maps.Point(18,18)
						}
					})
				}		
			if(APP.POS.AUTOCENTER) {
				APP.POS.AUTOCENTER=false
				APP.POS.MAP.setCenter(APP.POS.POSITION.MARKER.position)
				};		
			$("#TposGPS").text("GPS ON : Prec."+APP.POS.POSITION.Precisione.toFixed(2))
			},
		removeMarker:function(){
			if(typeof(APP.POS.POSITION.MARKER)=="object") APP.POS.POSITION.MARKER.setMap(null)	
			APP.POS.POSITION.MARKER=false	
			},
		errPos:function(err){ // map
			APP.POS.stopWatch()
			console.warn('ERROR(' + err.code + '): ' + err.message);
			},
		startGps:function(){
			APP.POS.manualOff()
			APP.POS.WATCH=true
			$("#BtnCenter").removeClass("ui-disabled")
			$("#BtnAdd").removeClass("ui-disabled")
			APP.POS.messaggio("Premere ADD per inserire un marker o disattivare GPS per puntamento manuale")
			// attiva il watchposition
			APP.POS.AUTOCENTER=true // centratura automatica (solo la prima volta)
			APP.POS.WATCH = navigator.geolocation.watchPosition(APP.POS.update,APP.POS.errPos,{enableHighAccuracy:true/*,timeout:10000*/});								
			// attiva testo gps
			$("#TposGPS").text("GPS ON").css("color","#0f0")
			},
		stopGps:function(){
			$("#BtnCenter").removeClass("ui-disabled")
			$("#BtnAdd").removeClass("ui-disabled")
			APP.POS.messaggio("Toccare lo schermo o attivare il gps")	
			if(APP.POS.WATCH!==false){
				APP.POS.removeMarker()
				navigator.geolocation.clearWatch(APP.POS.WATCH)
				APP.POS.WATCH=false
				$("#TposGPS").text("GPS OFF").css("color","#f50")
				}
			APP.POS.manualOn()
			},
		gpsButton:function(){
			if(APP.POS.WATCH===false) APP.POS.startGps()
			else APP.POS.stopGps()	},
		centerButton:function(){
			APP.POS.MAP.setCenter(APP.POS.POSITION.MARKER.position)
			},
		addButton:function(){
			//APP.POS.stopGps()
			APP.POS.PERIMETRO.insertAt(APP.POS.PERIMETRO.length,APP.POS.POSITION.MARKER.position);
			APP.POS.removeMarker()
			APP.POS.MARKERS.push(JSON.parse(JSON.stringify(APP.POS.POSITION)))
			$("#BtnSalva").toggleClass("ui-disabled",APP.POS.MARKERS.length<3)
			//APP.POS.drawMarkers()
			// se perimetro
			// se non perimetro
			// 
			},
		drawMarkers:function(){
			$.each(APP.POS.MARKERS,function(i,m){
				if(!m.MARKER){
					m.MARKER=new google.maps.Marker({
						position:new google.maps.LatLng(m.Lat,m.Lng),
						map:APP.POS.MAP,
						icon:'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'	
						})				
					}
				})
			},
		manualOff:function(){
			APP.POS.CLICK=false
			google.maps.event.clearListeners(APP.POS.MAP,"click")	
			},
		manualOn:function(){
			// stoppa il gps
			// APP.POS.stopGps()
			APP.POS.CLICK=true
			$("#BtnCenter").addClass("ui-disabled")
			$("#BtnAdd").addClass("ui-disabled")
			$("#BtnSalva").addClass("ui-disabled")			
			// attiva il click sulla mappa
			APP.POS.CLICK=true
			// messaggio help
			APP.POS.messaggio("Premere ADD per inserire un marker o attivare GPS per puntamento automatico")
			google.maps.event.addListener(APP.POS.MAP,"click",function(event) {
				APP.POS.removeMarker()	
				$("#BtnCenter").removeClass("ui-disabled")
				$("#BtnAdd").removeClass("ui-disabled")
				var lat = event.latLng.lat();
				var lng = event.latLng.lng();
				var latlng = new google.maps.LatLng(lat,lng)
				APP.POS.POSITION={
					Precisione:0,
					Lat:lat,
					Lng:lng,
					Elevazione:0,
					PrecisioneE:0,
					MARKER:new google.maps.Marker({
						draggable:true,
						position:new google.maps.LatLng(lat,lng),
						map:APP.POS.MAP,
						'icon': {
							'url': '/IMG/ICON/center-green.png',
							'anchor': new google.maps.Point(18,18)
							}
						})
					}
				//google.maps.event.clearListeners(APP.POS.MAP,"click");
				});				
			},
		usaPos:function(){
			if(APP.POS.WATCH===false){
				
				}
			else{
				// clicca sulla mappa
				
				}
			},
		messaggio:function(M){
			$("#HelpPosition").html(M)
			},
		},
	EDIT:{
		ACTION:false,
		go:function(A){ // edit
			APP.EDIT.ACTION=A
			if(APP.EDIT.ACTION===-1){
				$("#POPschedaTitle").text("Sei sicuro di voler cancellare questo asset?")						
				$("#POPschedaText").text("L'asset verrà segnato come cancellato e potrà essere recuperato da un amministratore.")						
				$("#POPscheda").popup("open")
				}
			else if(APP.EDIT.ACTION===0){
				$("#POPschedaTitle").text("Modifica asset")						
				$("#POPschedaText").text("L'asset verrà inserito nella app e potrà essere modificato in ogni sua parte (escl. categoria e tipologia.")						
				$("#POPscheda").popup("open")				
				}
			else if(APP.EDIT.ACTION===1){
				$("#POPschedaTitle").text("Clona asset")						
				$("#POPschedaText").text("Verrà creato un nuovo asset con queste caratteristiche e verranno chieste nuove coordinate.")						
				$("#POPscheda").popup("open")								
				}
			else if(APP.EDIT.ACTION===2){
				$("#POPschedaTitle").text("Aggiungi a preferiti")						
				var str='Questo asset verr&agrave; aggiunto ai preferiti.<br>Indicare un nome:<br>'
				str+='<input type="text" id="nomePreferito" value="'+APP.SCHEDA.Tipologia+' '+moment().format("D MMM H:mm:ss")+'">'
				$("#POPschedaText").html(str)						
				$("#POPscheda").popup("open")								
				}
			else{
				APP.EDIT.ACTION=false
				}
			},
		goConfirm:function(){ // edit
			if(APP.EDIT.ACTION===-1){
				$("#POPscheda").popup("close")
				APP.UTIL.ajax("DELETE","urbano/api/urbobjs/"+APP.SCHEDA.Id,"",function(RESULT){
					APP.TAB=false
					APP.MAP.MAP=false
					APP.UTIL.go("Home")
					})							
				}
			else if(APP.EDIT.ACTION===0){
				APP.ASSET=JSON.parse(JSON.stringify(APP.SCHEDA))				
				$("#POPscheda").popup("close")
				APP.UTIL.go("Dati")
				}
			else if(APP.EDIT.ACTION===1){
				APP.ASSET=JSON.parse(JSON.stringify(APP.SCHEDA))				
				APP.ASSET.Id=false
				APP.ASSET.Coordinate=false
				APP.ASSET.Perimetro=[]
				
				$.each(APP.ASSET.Immagini,function(i,v){APP.ASSET.Immagini[i].stato="copy"})
				$("#POPscheda").popup("close")
				APP.UTIL.go("Posizione")
				}
			else if(APP.EDIT.ACTION===2){	
				var NOME=$("#nomePreferito").val()
				if(NOME!=""){
					APP.UTIL.ajax("POST","/urbano/api/bookmarks",JSON.stringify({"uuid":APP.SCHEDA.Id,"name":NOME}),function(RESULT){
						if(RESULT.ERRORE){
							$("#POPschedaText").append($("<p>").html("Nessuna registrazione avvenuta, riprovare o contattare l'assistenza<br>"+RESULT.ERRORE))}
						else{
							APP.PREFERITI.push({"name":NOME,"uuid":APP.SCHEDA.uuid})
							$("#POPschedaText").html('<p>L&#39asset &egrave; stato registrato nei preferiti</p>')
							$("#POPschedaBTN").html('<a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">ok</a>')
							}
						},false)
					
					}
				else{
					$("#POPschedaText").append($("<p>").text("Inserire un nome!"))
					}			
				}
			else{
				APP.EDIT.ACTION=false
				}			
			},
		},
	login:function(IN){
		var lin=$("#usr").val()
		var psw=window.btoa($("#psw").val())
		$.ajax({
			"async": true,
			"crossDomain": true,
			"url": "http://159.122.132.173/urbano/login?username="+lin+"&password="+psw,
			"method": "POST",
			"accept":"text/json",
			"headers":{"cache-control":"no-cache"},
			success: function(response){
				var R=JSON.parse(response)
				APP.USER.logged=true
				APP.USER.token=R.id_token
				APP.USER.lin=lin
				APP.UTIL.getTabelle()	
				APP.UTIL.cookie.set("URBANO",{"USER":lin,"ASSET":""},true)
				APP.UTIL.go("Home")	
				},
			error:function(x,s,e){
				if(x.status==401){
					$("#POPloginTxt").html("Accesso non autorizzato, controllare username e password e riprovare.")						
					$("#POPlogin").popup("open")					
					}
				else{
					$("#POPloginTxt").html("Non &egrave; possibile effettuare il login")						
					$("#POPlogin").popup("open")					
					}
				}
			});				
		},
	fast:function(){
		APP.IMMAGINI=[]			// azzera tabella immagini
		APP.MAP.MAPPOS=false   		// riazzera mappa posizione
		APP.MAP.MARKERS=[]   		// riazzera i marker
		// copia asset default
		APP.ASSET=JSON.parse(JSON.stringify(DEFAULT.ASSET))
		APP.ASSET.Categoria="Arredo_urbano"
		APP.ASSET.Tipologia="Lampione"
		APP.UTIL.go("Immagini")
		},
	autolog:function(e){
		var evtobj=window.event?event:e
		if (evtobj.keyCode == 76 && evtobj.ctrlKey){
			$("#usr").val("UrbanoMake")
			$("#psw").val("test")
			}
		}
	}


	
