$(function(){
	// caricamento tabelle (solo all'inizio)
	if(!APP.TABDATA){APP.getAjax("getTabelle.asp","",function(RESULT){APP.TABDATA=RESULT.OK})}
	if(!APP.PREFERITI){APP.getAjax("getPreferiti.asp","",function(RESULT){APP.PREFERITI=RESULT.OK})}
	$(document).on("pagecontainerbeforechange",function(event,data){
		/*
		var toPage 		= data.toPage
		var	prevPage 	= (data.prevPage)?data.prevPage:""
		var	options 	= data.options
		var	absUrl 		= (data.absUrl)?$.mobile.path.parseUrl(data.absUrl).hash.split("#")[1]:""
		var	userLogged 	= false;					
		if(typeof(toPage)=="object" && absUrl!="Login"){
			if(!APP.USER.Logged){
				data.toPage[0]=$("#LoggedOut")[0];
				$.extend(data.options,{changeHash: false});
				}
			}
		*/
		});
	$(document).on("pagecontainershow",function(e,ui){
		var PAG=ui.toPage[0].id;
		APP.init.ALL()
		if(APP.init[PAG]){APP.init[PAG]()}
		});	
	$(document).on("pagecontainerbeforechange",function(e,ui){
		if(typeof(ui.toPage)=="object"){
			var PAG=ui.prevPage[0].id;
			if(APP.change[PAG]){APP.change[PAG]()}
			}
		});		
	})	
USER={
	"Task":"Urbano",
	"Token":"999",
	"Id":6,
	"Lin":"Test",
	"Dispositivo":navigator.userAgent
	}
APP={
	IMMAGINI:[],
	//
	MAP:false,
	MARKERS:[],
	MAPINFOW:false,
	LAT:41.896541,
	LNG:12.482232,
	ZOOM:10,
	ZOOMTYPE:"LAST",
	
	GETPOSITION:false,
	LAYER:"ALL",
	//
	TABDATA:false,			// tabelle per selezioni				
	TAB:false, 				// tabella asset registrati dall'utente
	//
	USER:false, 			// dati utente
	PREFERITI:false,			// tabella preferiti
	RECENTI:[],				// tabella recenti
	//
	SCHEDAID:false,
	//
	FLDMISURE:false,
	//
	TOOLDEFAULT:{
		margin:85,
		orientation:false,
		width:false,
		height:false,
		ratio:false,
		marker:{
			dragging:false,
			orientation:false,
			A:100,
			B:200,
			length:0,
			pixel:false
			},
		asset:{
			orientation:false,
			A:0,
			B:0,
			length:0,
			pixel:false
			}
		},
	//
	ASSET:false,			// dati temporanei asset			
	ASSETDEFAULT:{			// asset di default
		REGISTRA:false,		// flag registrazione
		MAP:false,			// mappa posizione
		MARKERS:[],			// marker posizione	
		POSITION:[],
		STATUS:false,			// 0=vuoto 1=attivo   2=completo	
		ACTUALMARK:false,		
		//
		Id:false,
		Coordinate:false,
		Categoria:"",
		Tipologia:"",
		Dati:[],
		Immagini:[],
		Misure:[],
		Stato:[],
		//
		DatiOK:false,
		ImmaginiOK:false,
		MisureOK:false,
		StatoOK:false
		//
		},
	chkSTATUS:function(){		
		if( APP.ASSET.Categoria && APP.ASSET.Tipologia){$(".btn-Dati,.btn-Misure,.btn-Posizione,.btn-Immagini,.btn-Stato,.btn-Registra").removeClass("ui-disabled")}
		else{$(".btn-Dati,.btn-Misure,.btn-Posizione,.btn-Immagini,.btn-Stato,.btn-Registra").addClass("ui-disabled")}
		if( APP.ASSET.Coordinate &&
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
	getAjax:function(AJAX,DATA,SUCCESS){
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
				$("#messaggioLogin").html("Errori nella richiesta AJAX "+AJAX+"<br>"+escape(B)+" - "+escape(C))
				}
			});					
		},
	preInit:{
		},
	goPagina:function(PAG){
		$("body").pagecontainer("change","#"+PAG);			
		},
	init:{
		ALL:function(){
			APP.chkSTATUS()
			},
		Home:function(){
			//
			if(APP.GETPOSITION){
				navigator.geolocation.getCurrentPosition(function(position){
					APP.LAT=position.coords.latitude;
					APP.LNG=position.coords.longitude;					
					APP.TAB=false
					drawMap()
					})
				APP.GETPOSITION=false			
				}
			else{
				drawMap()	
				}
			//
			function drawMap(){
				if(!APP.TAB){APP.getAjax("getAssets.asp","token="+USER.Token+"&lat="+APP.LAT+"&lng="+APP.LNG+"&zoom="+APP.ZOOM+"&layer="+APP.LAYER,function(RESULT){APP.TAB=RESULT.OK})}
				if(!APP.MAP){
					APP.MARKERS=[]	
					var coords=new google.maps.LatLng(APP.LAT,APP.LNG)
					APP.MAP = new google.maps.Map(document.getElementById('mappaGoogle'), {
						center: coords,
						disableDefaultUI: true,
						mapTypeControl: true,
						zoom: 10
						});
					APP.MAP.setOptions({styles:[{stylers: [{ hue: "#2d5d84" },{ saturation: -20 }]},
						{featureType: "road",elementType: "geometry",stylers:[{lightness:100},{visibility: "simplified" }]},
						{featureType: "road",elementType: "labels",stylers:[{visibility:"on"}]},
						{featureType: "poi",elementType: "labels",stylers:[{visibility:"off"}]},
						{featureType: "transit",elementType: "labels",stylers:[{visibility:"off"}]}
						]});
					$.each(APP.TAB,function(IND,ASSET){
						if(APP.LAYER=="ALL" || APP.LAYER==ASSET.Categoria){
							var MARKER= new google.maps.Marker({
								position:{lat:ASSET.Coordinate.Lat,lng:ASSET.Coordinate.Lng},
								map: APP.MAP,							
								icon:	// (IND==0)?
										// "http://google.com/mapfiles/ms/micons/red-pushpin.png":
									(APP.TABDATA[ASSET.Categoria][ASSET.Tipologia].Icona)?APP.TABDATA[ASSET.Categoria][ASSET.Tipologia].Icona:
									(APP.TABDATA[ASSET.Categoria].Icona)?APP.TABDATA[ASSET.Categoria].Icona:
									"http://google.com/mapfiles/ms/micons/blue.png"					
								})
							MARKER.addListener('click', function(){
								if(APP.MAPINFOW){APP.MAPINFOW.close()}
								APP.MAPINFOW = new InfoBox({
									content:
										'<div style="padding:4px 0px 4px 45px;color:#fff">ID:'+ASSET.Id+'<br>'+
										ASSET.Categoria+' '+
										ASSET.Tipologia+'<br>Lat:'+
										(ASSET.Coordinate.Lat.toFixed(6))+'<br>Lng.'+
										(ASSET.Coordinate.Lng.toFixed(6))+
										'</div><a href="javascript:APP.Scheda('+IND+')" class="ui-btn ui-mini">Scheda asset</a>',
									disableAutoPan: false,
									maxWidth: 150,
									pixelOffset: new google.maps.Size(-20, -45),
									zIndex: null,
									boxStyle: {
										border:"1px solid rgb(131,196,249)",
										padding:"0px",
										background: "url(img/bgbox.png)",//rgba(45,93,132,0.75)",
										//opacity: 0.75,
										width: "150px"
										},
									closeBoxMargin: "2px 2px 2px 2px",
									closeBoxURL: "img/cancella.png",
									infoBoxClearance: new google.maps.Size(1, 1)
									});
								APP.MAPINFOW.open(APP.MAP,this)
								loc = new google.maps.LatLng(this.position.lat(),this.position.lng()); 
								APP.MAP.panTo(loc)
								});
							APP.MARKERS.push(MARKER)					
							}
						})								
					var markerCluster = new MarkerClusterer(APP.MAP,APP.MARKERS,{
						maxZoom:15,
						zoomOnClick:true,
						styles:[{
							url: 'img/cluster.png',
							height: 35,
							width: 35,
							anchor: [0, 0],
							textColor: '#ffffff',
							textSize: 10							
							}]
						})	
					APP.FitZoom(APP.MAP,APP.MARKERS)
					window.setTimeout(function(){	
						APP.MAP.addListener('zoom_changed',function(){
							if(APP.MAPINFOW){APP.MAPINFOW.close()};
							APP.ZOOMTYPE="ALL"
							});
						},500);
					}		
				}
			},
		Layer:function(){
			var TABL=[];
			var str=''
			str+='<a href="javascript:APP.MapScegliLayer(&quot;ALL&quot;)" class="ui-btn ui-shadow ui-corner-all">Tutto</a>'
			$.each(APP.TABDATA,function(i,v){
				str+='<a href="javascript:APP.MapScegliLayer(&quot;'+i+'&quot;)" class="ui-btn ui-shadow ui-corner-all">'+(i.replace(/_/g,' '))+'</a>'
				})
			$("#FieldsLayer").html(str)
			$('#Layer').trigger('create');
			},
		Aggiungi:function(){
			APP.MAPPOS=false   		// riazzera mappa posizione
			APP.MARKERS=[]   		// riazzera i marker
			// copia asset default
			APP.ASSET=JSON.parse(JSON.stringify(APP.ASSETDEFAULT))
			// carica recenti
			APP.RECENTI=[]
			for(var i=0;i<5;i++){APP.RECENTI.push(APP.TAB[i])}
			// svuota select
			$("#SelectPreferiti").html('<option>Preferiti</option>').selectmenu("enable");
			$("#SelectRecenti").html('<option>Recenti</option>').selectmenu("enable");
			$("#SelectCategoria").html('<option>Categoria</option>').selectmenu("enable");
			$("#SelectTipologia").html('<option>Tipologia</option>').selectmenu("disable");		
			// carica select
			$.each(APP.PREFERITI,function(index,value){$("#SelectPreferiti").append('<option value="'+index+'">'+value.Nome+'</option>')})
			$.each(APP.RECENTI,function(index,value){$("#SelectRecenti").append('<option value="'+index+'">'+value.Id+' '+value.Coordinate.Lng+'-'+value.Coordinate.Lat+'</option>')})
			for(var CAT in APP.TABDATA){if(CAT!="Dati"){$("#SelectCategoria").append('<option value="'+CAT+'">'+CAT.replace(/_/," ")+'</option>')}}	
			// attiva e eventchange 
			$("#SelectPreferiti")
				.selectmenu('refresh',true)
				.change(function(){doSelect("Preferiti")});
			$("#SelectRecenti")
				.selectmenu('refresh',true)
				.change(function(){doSelect("Recenti")});
			$("#SelectCategoria")
				.selectmenu('refresh',true)
				.change(function(){doSelect("Categoria")});
			$("#SelectTipologia")
				.selectmenu('refresh',true)
				.change(function(){doSelect("Tipologia")});			
			function doSelect(SELECT){
				var val=$("#Select"+SELECT).val()
				if(SELECT=="Preferiti"){
					for(OBJ in APP.PREFERITI[val]){
						APP.ASSET[OBJ]=APP.PREFERITI[val][OBJ]
						}
					APP.goPagina("Dati")
					}
				else if(SELECT=="Recenti"){
					for(OBJ in APP.RECENTI[val]){
						APP.ASSET[OBJ]=APP.RECENTI[val][OBJ]
						}
					$(".btn-Dati,.btn-Misure,.btn-Posizione,btn-Immagini,.btn-stato").removeClass("ui-disabled")
					APP.goPagina("Dati")
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
						a=0
						b=APP.TABDATA[val][TIP]
						c=0
						//$("#SelectTipologia").append('<option value="'+APP.TABDATA[val][TIP]+'">'+APP.TABDATA[val][TIP].replace(/_/," ")+'</option>')
						$("#SelectTipologia").append('<option value="'+TIP+'">'+TIP.replace(/_/," ")+'</option>')
						}	
					// attiva select
					$("#SelectTipologia")
						.selectmenu('refresh', true)
						.selectmenu("enable");		
					}
				else if(SELECT=="Tipologia"){
					APP.ASSET.Tipologia=val
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Dati,function(index,value){APP.ASSET.Dati[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(index,value){APP.ASSET.Immagini[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure,function(index,value){APP.ASSET.Misure[index]=false})
					$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Stato,function(index,value){APP.ASSET.Stato[index]=false})
					// attiva i bottoni in menu
					$(".btn-Dati,.btn-Misure,.btn-Posizione,btn-Immagini,.btn-stato").removeClass("ui-disabled")
					APP.goPagina("Dati")
					}
				}
			},
		Dati:function(){
			$(".subtitle").html((APP.ASSET.Categoria+" - "+APP.ASSET.Tipologia).replace(/_/g," "))
			$("#FieldsDati").html(APP.drawFields("Dati"))
			$('#Dati').trigger('create');
			},
		Immagini:function(){
			$("#FieldsImmagini").html(APP.drawFields("Immagini"))
			$('#Immagini').trigger('create');
			$(".BTNimmagine").on("click",function(e){APP.clickImg(e)})			
			$(".immagine").on("change",function(e){APP.getImg(e)})
			$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(index,value){APP.drawImg(index)})
			},
		Misure:function(){
			$("#FieldsMisure").html(APP.drawFields("Misure"))			
			$('#Misure').trigger('create');
			},
		ToolMisure:function(){
			if(APP.TOOL.field){
				APP.TOOL.init()
				}
			else{
				APP.goPagina("Misure")
				}
			},
		Stato:function(){
			$("#FieldsStato").html(APP.drawFields("Stato"))			
			$('#Stato').trigger('create');
			},
		Posizione:function(){
			APP.ASSET.ACTUARLMARK=false
			var pos=new google.maps.LatLng(41.890261,12.492319) 
			APP.MAPPOS = new google.maps.Map(document.getElementById("mappaGeolocazione"),{
				center:pos,
				tilt:0,
				zoom:18,
				mapTypeId:google.maps.MapTypeId.SATELLITE,
				disableDefaultUI: true,
				navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL}
				});
			APP.WATCH = navigator.geolocation.watchPosition(APP.updatePos,APP.errorPos,{enableHighAccuracy:true/*,timeout:10000*/});
			$("#BTNusaPosizione").show()
			$("#BTNcorreggiPosizione").hide()
			},
		Posizioni:function(){
			var str='<ul>'
			$.each(APP.ASSET.POSITION,function(i,val){
				str+='<li>'+val.Precisione+':'+val.Lat+","+val.Lng+"</li>"
				})			
			str+='</ul>'
			$("#FieldsPosizioni").html(str)			
			},
		Registra:function(){
			str=''
			if(APP.ASSET.STATUS){
				//str+='<div data-role="fieldcontain"><fieldset data-role="controlgroup">'
				/*	
				str+='<a href="javascript:APP.togRiepilogo()" class="ui-btn"  id="BTNriepilogo">Riepilogo</a>'
				str+='<div id="riepilogo" style="display:none">'
				*/
				str+='<div id="riepilogo">'
				str+='<div data-role="collapsibleset" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d">'
				str+='<div data-role="collapsible"><h3>Riepilogo</h3>'

				str+='<ul data-role="listview">'
				str+='<li><strong>Asset:</strong> '+APP.ASSET.Categoria+' '+APP.ASSET.Tipologia+'</li>'
				str+='<li><strong>Posizione:</strong><br>Precisione: '+APP.ASSET.Coordinate.Precisione+'<br>Lat: '+APP.ASSET.Coordinate.Lat+'<br>Lng: '+APP.ASSET.Coordinate.Lng+'</li>'
				str+='<li><strong>Dati:</strong><br>'
				$.each(APP.ASSET.Dati,function(i,val){
					str+=i.replace(/_/g,' ')+'='+val+'<br>'
					})
				str+='</li>'
				//
				str+='<li style="padding-left:0.7em;"><strong>Immagini:</strong><br> '
				$.each(APP.ASSET.Immagini,function(i,val){
					str+='<img src="'+val.src+'" style="max-width:100px;max-height:100px;">'
					})
				str+='</li>'
				//
				str+='<li><strong>Misure:</strong><br> '
				$.each(APP.ASSET.Misure,function(i,val){
					str+=i.replace(/_/g,' ')+'='+val+'<br>'
					})
				str+='</li>'
				//
				str+='<li><strong>Stato:</strong><br> '
				$.each(APP.ASSET.Stato,function(i,val){
					str+=i.replace(/_/g,' ')+'='+val+'<br>'
					})
				str+='</li>'
				str+='<li>'	
				str+='Aggiungi a preferiti?&nbsp;&nbsp;<select name="preferiti" id="preferiti" data-role="flipswitch" data-mini="true">'
				str+='<option value="Si">Si</option>'
				str+='<option value="No" selected="true">No</option>'
				str+='</select>'
				str+='<li>'	
				str+='</ul>'
				/*
				str+='<input type="checkbox" name="preferiti" id="preferiti" class="custom" />'
				str+='<label for="preferiti" style="text-align:center">Aggiungi a preferiti</label>'
				*/
				str+='</div></div>'
				str+='<a href="javascript:APP.registra()" class="ui-btn ui-corner-all ui-shadow" id="BTNregistra">Registra</a>'
				str+='</div>'
				str+='<div id="postRegistraWait" style="display:none"><div class="spinner"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div><div class="rect5"></div></div></div>'
				str+='<div id="postRegistra" style="display:none">'
				str+='<p>L&#39;asset è stato registrato con l&#39;ID.<span id="newId"></span></p>'
				str+='<a href="javascript:APP.nuovaPosizione()" class="ui-btn ui-corner-all ui-shadow" id="BTNaggiungiposizione">Aggiungi posizione</a>'
				str+='<a href="javascript:APP.nuovoAsset()" class="ui-btn ui-corner-all ui-shadow" id="BTNnuovoasset">Nuovo asset</a>'
				str+='</div>'
				}
			else{
				str+='<div style="text-align:center"><div style="background:#f00;color:#fff;padding:10px;"><strong>L&#39;asset non può essere registrato!</strong></div>'
				str+='Occorre caricare i seguenti dati:</div>'
				if(!APP.ASSET.Coordinate){str+='<a href="#Posizione" class="ui-btn ui-corner-all ui-shadow">Posizione</a>'}
				if(!APP.ASSET.DatiOK){str+='<a href="#Dati" class="ui-btn ui-corner-all ui-shadow">Dati</a>'}
				if(!APP.ASSET.ImmaginiOK){str+='<a href="#Immagini" class="ui-btn ui-corner-all ui-shadow">Immagini</a>'}
				if(!APP.ASSET.MisureOK){str+='<a href="#Misure" class="ui-btn ui-corner-all ui-shadow">Misure</a>'}
				if(!APP.ASSET.StatoOK){str+='<a href="#Stato" class="ui-btn ui-corner-all ui-shadow">Stato</a>'}
				}
			$("#FieldsRegistra").html(str)	
			$('#Registra').trigger('create');			
			},
		Scheda:function(){
			if(APP.SCHEDAID){
				var str=''
				str+='SCHEDA '+APP.SCHEDAID
				$("#FieldsScheda").html(str)	
				}
			else{
				APP.goPagina("Home")
				}
			}		
		},
	change:{
		Dati:function(){
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
			APP.chkSTATUS()
			$("#FieldsDati").html("")
			},
		Immagini:function(){
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
			APP.chkSTATUS()
			$("#FieldsImmagini").html("")
			},
		Misure:function(){		
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
			APP.chkSTATUS()
			$("#FieldsMisure").html("")
			},
		ToolMisure:function(){
			APP.FLDMISURE=false
			$("#FieldsToolMisure").html("")
			},
		Stato:function(){		
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
			APP.chkSTATUS()
			$("#FieldsStato").html("")
			},
		Posizione:function(){
			if(APP.WATCH){
				navigator.geolocation.clearWatch(APP.WATCH);
				}
			$("#FieldsPosizione").html("")
			},
		Registra:function(){
			if(APP.ASSET.REGISTRA){
				APP.goPagina("Aggiungi")	
				}
			$("#FieldsRegistra").html("")
			},
		Scheda:function(){
			APP.SCHEDAID=false
			}
		},
	drawFields:function(PAG){
		var str=''
		$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia][PAG], function(index,data){
			if(data.tipo=="txt"){
				str+='<input type="text" name="'+index+'" placeholder="'+index.replace(/_/g,' ')+' '+(data.ex||'.')+'" '+((APP.ASSET[PAG][index])?' value="'+APP.ASSET[PAG][index]+'"':'')+'/>'
				}
			if(data.tipo=="cm"){
				str+='<div class="ui-grid-a"><div class="ui-block-a">'
				str+='<input type="number" name="'+index+'" placeholder="'+index.replace(/_/g,' ')+' '+(data.ex||'.')+'" '+((APP.ASSET[PAG][index])?' value="'+APP.ASSET[PAG][index]+'"':'')+' />'
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
				str+='<textarea style="height:200px" name="'+index+'" placeholder="'+index.replace(/_/g,' ')+'">'+(APP.ASSET[PAG][index]||'')+'</textarea>'
				}
			if(data.tipo=="img"){
				str+='<button class="ui-btn ui-shadow ui-corner-all BTNimmagine" data="'+index+'">'+index.replace(/_/g,' ')+'</button>'
				str+='<div style="width:0px;height:0px;overflow:hidden;"><input type="file" capture="camera" accept="image/*" id="'+index+'" class="immagine"></div>'
				str+='<div class="IMGimmagine" id="IMG'+index+'" style="margin:auto">'
				str+='</div>'
				}
			})
		return(str)		
		},	
	clickImg:function(event){
		$('#'+$(event.target).attr("data")).trigger('click');
		},
	getImg:function(e){
		e.preventDefault();
        e=e.originalEvent;
        var target=e.dataTransfer||e.target;
        var tipo=$(target).attr("id");
		var file=target&&target.files&&target.files[0];
		var options={canvas:true};
		var WW,HH,OO;
        loadImage.parseMetaData(file,function(data){
			if(data.exif){
				OO=data.exif.get('Orientation');
				WW=data.exif.get('ImageWidth');
				HH=data.exif.get('ImageHeight');
				options.orientation=OO;
				}
            loadImage(file,function(img){
				APP.ASSET.Immagini.push({
					tipo:tipo,
					//width:WW||img.width,
					//height:HH||img.height,
					width:img.width,
					height:img.height,
					file:file,
					src:img.src||img.toDataURL(),
					orientation:OO||1
					})
				APP.drawImg(tipo)
				},options)
            });		
		},
	drawImg:function(TIPO){
		$("#POPimmagine").popup("close")
		$("#IMG"+TIPO).empty()
		var ii=0
		if(APP.ASSET.Immagini.length>0){
			var I=[]
			$.each(APP.ASSET.Immagini,function(i,v){if(v.tipo==TIPO){I.push(v)}})
			$.each(I,function(i,v){
				var NEWW=parseInt(($(".BTNimmagine").width()-(I.length*4))/I.length)
				if(NEWW<($(".BTNimmagine").width()/4)){NEWW=$(".BTNimmagine").width()/4}
				var NEWH=parseInt(NEWW/(v.width/v.height))
				//console.log("display="+NEWW+"x"+NEWH)
				$("#IMG"+TIPO).append($("<a>",{
					"href":'javascript:APP.IMGpopup('+i+',"'+TIPO+'")',
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
				})		
			}
		else{
			$("#BTNsalvaimmagini").addClass("ui-disabled")
			}
		},
	IMGremove:function(){
		var IND=$("#imgPOPimmagine").attr("ind")
		var TIPO=$("#imgPOPimmagine").attr("tipo")
		APP.ASSET.Immagini.splice(IND,1)
		APP.drawImg(TIPO)
		},
	IMGpopup:function(IND,TIPO){
		$("#imgPOPimmagine").attr({
			"src":APP.ASSET.Immagini[IND].src,
			"ind":IND,
			"tipo":TIPO
			})
		//if(!APP.IMMAGINI[IND].orientation){$("#BTNrotate").addClass("ui-disabled")}
		$("#POPimmagine").popup("open")				
		},
	IMGpopupClose:function(){
		APP.drawImg($("#imgPOPimmagine").attr("tipo"))		
		},
	IMGrotate:function(){
		var IND=$("#imgPOPimmagine").attr("ind")
		var TIPO=$("#imgPOPimmagine").attr("tipo")
		if(APP.ASSET.Immagini[IND].orientation){
			var OO=(APP.ASSET.Immagini[IND].orientation==1)?6:(APP.ASSET.Immagini[IND].orientation==6)?3:(APP.ASSET.Immagini[IND].orientation==3)?8:(APP.ASSET.Immagini[IND].orientation==8)?1:1
			options={
				"orientation":OO,
				"canvas":true
				}
			loadImage(APP.ASSET.Immagini[IND].file,function(img){
				var WW=APP.ASSET.Immagini[IND].width
				var HH=APP.ASSET.Immagini[IND].height
				APP.ASSET.Immagini[IND].width=HH
				APP.ASSET.Immagini[IND].height=WW
				APP.ASSET.Immagini[IND].src=img.src||img.toDataURL()
				APP.ASSET.Immagini[IND].orientation=OO
				APP.drawImg(TIPO)
				},options)
			}
		},
	TOOL:{
		ind:false,
		field:false,
		tipo:false,		
		go:function(FLD,TIPO){
			APP.TOOL.field=FLD
			APP.TOOL.tipo=(TIPO=="verticale")?'V':'H'
			APP.TOOL.draggable=false
			APP.goPagina("ToolMisure")
			},
		init:function(){
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
				$("#ToolImage").append($("<div>",{"id":"infoImg"}))
				$("#ToolImage").append($("<div>",{"id":"dragMarkerA","class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragMarkerB","class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragAssetA" ,"class":"dragger"}))
				$("#ToolImage").append($("<div>",{"id":"dragAssetB" ,"class":"dragger"}))
				$("#ToolImage").append($("<img>",{"id":"ToolIMG","indice":"1"}))
				}
			else{
				$("#ToolImage").html('<strong>Attenzione!</strong><br>Per utilizzare il tool per le misure occorre aver caricato almeno un immagine.').show()
				}	
			$('#ToolMisure').trigger('create');
			APP.TOOL.change(-1)			
			},
		/*
		APP.ASSET.Immagini[i]={
			file:
			width:
			height:
			src:
			tipo:
			TOOL:{
				margin:85,
				orientation:false,
				width:false,
				height:false,
				ratio:false,
				marker:{
					orientation:false,
					A:false,
					B:false,
					length:false,
					pixel:false
					}
				asset:{
					orientation:false,
					A:false,
					B:false,
					length:false,
					pixel:false
					}
				}
			}
		#ToolImage{
			display:inline-block;
			margin:auto;
			width:0px;// w img
			height:0px;// w img
			overflow:hidden;
			}
		.dragger{
			display:none;
			position:absolute;
			z-index:900;
			background-position:center;
			//background-repeat:repeat-x;
			top:0px;
			left:0px;
			}
		<div id="ToolImage"> dimensioni immagine, margin auto,
			<div id="infoImg"></div>
			<div id="dragMarkerA" class="dragger"></div>
			<div id="dragMarkerB" class="dragger"></div>
			<div id="dragAssetA"  class="dragger"></div>
			<div id="dragAssetB"  class="dragger"></div>
			<img id="ToolIMG" indice="i"></div>
		</div>		
		*/
		change:function(DIR){
			// trova il nuovo indice
			var IND=DIR+parseInt($("#ToolIMG").attr("indice"))					
			if(IND>APP.ASSET.Immagini.length-1){IND=0}
			if(IND<0){IND=APP.ASSET.Immagini.length-1}
			APP.TOOL.ind=IND
			// prende l'immagine
			var IMG=APP.ASSET.Immagini[IND]
			// redirect o inizializzazione
			if(IMG.TOOL&&IMG.TOOL.marker.pixel){	APP.TOOL.asset("A")}
			else{IMG.TOOL=JSON.parse(JSON.stringify(APP.TOOLDEFAULT))}
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
			$("#ToolImage, #ToolIMG").css({
				"width":IMG.TOOL.width+"px",
				"height":IMG.TOOL.height+"px"
				})
			},
		marker:function(STAGE){
			APP.TOOL.popup(false)
			if(APP.TOOL.draggable){$(document).off("vmousedown vmousemove vmouseup",APP.TOOL.draggable);APP.TOOL.draggable=false}
			$("#subtitle").html("marker "+STAGE+" "+((STAGE=="A")?"1":"2")+"/4")
			$("#ToolMainText").html(
				'Spostare la riga <u>'+((STAGE=="A")?"rossa":"verde")+'</u> in corrispondenza della parte <u>'+
				((APP.TOOL.tipo=="V")?(STAGE=="A")?'superiore':'inferiore':(STAGE=="A")?'sinistra':'destra')+					
				'</u> del marcatore'
				)
			$("#ToolBtn").html('<a href="javascript:APP.TOOL.'+((STAGE=="A")?'marker(&quot;B&quot;)':'asset(&quot;A&quot;)')+'" class="ui-btn">Accetta Marker '+STAGE+'</a>')		
			$("#ToolBack").attr('href','javascript:'+((STAGE=="A")?'APP.goPagina("Misure")':'APP.TOOL.marker("A")'))					
			$(".dragger").css("zIndex","900");
			var offset = $("#ToolImage").offset();	
			$("#dragMarker"+STAGE).css({
				"width":(APP.TOOL.tipo=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.width+"px":"0px",
				"height":(APP.TOOL.tipo=="V")?"0px":APP.ASSET.Immagini[APP.TOOL.ind].TOOL.height+"px",
				"border-bottom":(APP.TOOL.tipo=="V")?"2px dashed "+((STAGE=="A")?"#f00":"#AA0"):"none",
				"border-left":(APP.TOOL.tipo=="V")?"none":"2px dashed "+((STAGE=="A")?"#f00":"#AA0"),
				"top":offset.top+((APP.TOOL.tipo=="V")?APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE]:0)+"px",
				"left":offset.left+((APP.TOOL.tipo=="V")?0:APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE])+"px",				
				"zIndex":"901"
				}).show()
			APP.TOOL.draggable="#ToolIMG"			
			$(document).on("vmousedown",APP.TOOL.draggable, function(event){
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragging=true
				var POS=(APP.TOOL.tipo=="V")?event.pageY:event.pageX
				APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragstart=POS
				event.preventDefault();
				});	
			$(document).on("vmousemove",APP.TOOL.draggable, function(event){
				if(APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragging){
					var POS=(APP.TOOL.tipo=="V")?event.pageY:event.pageX
					var DIFF=POS-APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker.dragstart//-offset[(APP.TOOL.tipo=="V")?"top":"left"]
					if(DIFF>2||DIFF<2){
						var OFF=$("#dragMarker"+STAGE).offset()
						if(APP.TOOL.tipo=="V")	{$("#dragMarker"+STAGE).css("top",OFF.top+DIFF+"px")}
						else					{$("#dragMarker"+STAGE).css("left",OFF.left+DIFF+"px")}
						APP.ASSET.Immagini[APP.TOOL.ind].TOOL.marker[STAGE]=(APP.TOOL.tipo=="V")?OFF.top+DIFF-offset.top:OFF.left+DIFF-offset.left
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
		popup:function(OPEN){
			if(OPEN){$("#POPmisure").popup("open")}
			else{$("#POPmisure").popup("close")}
			},
		},
	goToolMisure:function(FLD){
		APP.TOOL.FIELD=FLD
		APP.goPagina("ToolMisure")
		},
	ToolStage:function(STAGE){ // selezione marker superiore/sinstra		
		if(APP.TOOL.STAGE){$("#dragMarker"+APP.TOOL.STAGE).draggable("destroy")}
		APP.TOOL.STAGE=STAGE
		$("#subtitle").html("stage "+STAGE+" of 5")
		if(STAGE==6){
			if(APP.TOOL.TIPO=="V"){
				var a=APP.TOOL.MARKERBOT-APP.TOOL.MARKERTOP
				var b=APP.TOOL.MARKERLENGTH
				var c=b/a
				var d=APP.TOOL.ASSETBOT-APP.TOOL.ASSETTOP
				var e=c*d
				var f=0
				APP.ASSET.Misure[APP.TOOL.FIELD]=parseInt ((APP.TOOL.MARKERLENGTH/(APP.TOOL.MARKERBOT-APP.TOOL.MARKERTOP))*(APP.TOOL.ASSETBOT-APP.TOOL.ASSETTOP))
				}
			else{
				APP.ASSET.Misure[APP.TOOL.FIELD]=parseInt (((APP.TOOL.MARKERLEFT-APP.TOOL.MARKERRIGHT)/APP.TOOL.MARKERLENGTH)*(APP.TOOL.ASSETLEFT-APP.TOOL.ASSETRIGHT))
				}
			APP.goPagina("Misure")
			}
		else if(STAGE==0){
			APP.goPagina("Misure")
			}
		else{
			var ELEM,DIME;
			DIME=(APP.TOOL.TIPO=="V")?"ALTEZZA":"LARGHEZZA"	 
			$("#dragMarker"+STAGE).show()
			if(STAGE==1){
				ELEM=(APP.TOOL.TIPO=="V")?"MARKERTOP":"MARKERLEFT"
				$("#ToolMainText").html('Spostare la riga <u>rossa</u> in corrispondenza della parte <u>'+((APP.TOOL.TIPO=="V")?'superiore':'sinistra')+'</u> del marcatore')
				}		
			if(STAGE==2){
				ELEM=(APP.TOOL.TIPO=="V")?"MARKERBOT":"MARKERRIGHT"
				$("#ToolMainText").html('Spostare la riga <u>verde</u> in corrispondenza della parte <u>'+((APP.TOOL.TIPO=="V")?'inferiore':'destra')+'</u> del marcatore')
				}		
			if(STAGE==3){
				$("#dragMarker1,#dragMarker2,#dragMarker4,#dragMarker5").hide()	
				$("#ToolMainText").html(
					'Indicare '+((APP.TOOL.TIPO=="V")?'l&#39;altezza':'la lunghezza')+' del marcatore <br>'+
					'<input type="number" id="markerLength" value="200">'
					)
				}		
			if(STAGE==4){
				APP.TOOL.MARKERLENGTH=$("#markerLength").val()
				ELEM=(APP.TOOL.TIPO=="V")?"ASSETTOP":"ASSETLEFT"
				$("#ToolMainText").html('Spostare la riga <u>rossa</u> in corrispondenza della parte <u>'+((APP.TOOL.TIPO=="V")?'superiore':'sinistra')+'</u> dell&#39;asset')
				}		
			if(STAGE==5){
				ELEM=(APP.TOOL.TIPO=="V")?"ASSETBOT":"ASSETRIGHT"
				$("#ToolMainText").html('Spostare la riga <u>verde</u> in corrispondenza della parte <u>'+((APP.TOOL.TIPO=="V")?'inferiore':'destra')+'</u> dell&#39;asset')
				}		
			$("#ToolBtn").html('<a href="javascript:APP.ToolStage('+(STAGE+1)+')" class="ui-btn">Accetta '+STAGE+'/5</a>')		
			$("#ToolBack").attr('href','javascript:APP.ToolStage('+(STAGE-1)+')')					
			var offset = $("#ToolImage").offset();
			$(".dragMarker").css("zIndex","900")			
			$("#dragMarker"+STAGE).css("zIndex","901").draggable({
				axis:(APP.TOOL.TIPO=="V")?"y":"x",
				drag: function(){				
					APP.TOOL[ELEM]=parseInt($(this).offset().top+(APP.TOOL[DIME]/2))
					$("#tooltest").html(APP.TOOL[ELEM])					
					}
				})	
			}
		},

	ToolChangeImg:function(DIR){// DIR +1 / -1 = direzione
		// $("#dragMarker1,#dragMarker2,#dragMarker4,#dragMarker5").hide()	
		// trova il nuovo indice
		var IND=DIR+parseInt($("#ToolIMG").attr("indice"))					
		if(IND>APP.ASSET.Immagini.length-1){IND=0}
		if(IND<0){IND=APP.ASSET.Immagini.length-1}
		//
		if(APP.ASSET.Immagini[APP.TOOL.IND].MARKER&&APP.ASSET.Immagini[APP.TOOL.IND].MARKER.pixel!=0){
			APP.ToolDimensions()
			}
		
		
		
		
		//var MARGIN=$("#ToolMain").height()+14
		var MARGIN=85
		var DIMW=$("#ToolMisure").width()
		var DIMH=($("#ToolMisure").height()-MARGIN)
		var IMGW=APP.ASSET.Immagini[IND].width
		var IMGH=APP.ASSET.Immagini[IND].height
		var RATIO = Math.min(DIMW/IMGW,DIMH/IMGH);
		APP.TOOL.IND=IND			
		APP.TOOL.ALTEZZA=parseInt(IMGH*RATIO)
		APP.TOOL.LARGHEZZA=parseInt(IMGW*RATIO)
		APP.TOOL.MARGINE=parseInt(MARGIN)
		//
		$("#ToolIMG").attr({
			"src":APP.IMMAGINI[IND].src,
			"indice":IND
			})
			.css({
			"height":APP.TOOL.ALTEZZA+"px",
			"width":APP.TOOL.LARGHEZZA+"px"
			})				
		$("#ToolImage").css({
			"margin-top":APP.TOOL.MARGINE+"px",
			"height":APP.TOOL.ALTEZZA+"px",
			"width":APP.TOOL.LARGHEZZA+"px"
			})	
		$("#dragMarkerContainer").css({
			"width":APP.TOOL.LARGHEZZA+"px",
			"height":APP.TOOL.ALTEZZA+"px"
			})	
		$(".dragMarker").css({
			"width":APP.TOOL.LARGHEZZA+"px",
			"height":APP.TOOL.ALTEZZA+"px"
			})	
		},		
	messaggio:function(TIPO,TESTO){
		alert(TESTO)
		},	
	registra:function(){
		//
		$("#BTNregistra").addClass("ui-disabled")
		$("#riepilogo").slideUp();
		$("#postRegistraWait").show()
		//
		var NEWPROPS={}
		var NEWFILES={}
		$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Dati,function(i,v){NEWPROPS[i]=APP.ASSET.Dati[i]})
		$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Immagini,function(i,v){NEWFILES[i]=APP.ASSET.Immagini[i]})
		$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Misure,function(i,v){NEWPROPS[i]=APP.ASSET.Misure[i]})
		$.each(APP.TABDATA[APP.ASSET.Categoria][APP.ASSET.Tipologia].Stato,function(i,v){NEWPROPS[i]=APP.ASSET.Stato[i]})
		var adesso=new Date()
		var NEWASSET={
			Id:false,
			User:USER.Lin,
			Data:adesso.getFullYear()+((adesso.getMonth()<9?"0":"")+adesso.getMonth()+1)+((adesso.getDate()<9?"0":"")+adesso.getDate),
			Task:USER.Task,
			Dispositivo:USER.Dispositivo,
			Coordinate:{
				Precisione:APP.ASSET.Coordinate.Precisione,
				Lat:APP.ASSET.Coordinate.Lat, 
				Lng:APP.ASSET.Coordinate.Lng
				},			
			Categoria:APP.ASSET.Categoria,
			Tipologia:APP.ASSET.Tipologia,			
			}
		// invio i dati
		// AJAX >> NEWASSET
		// prendo l' ID nuovo Asset
		APP.ASSET.Id=333
		// invio i PROPS
		// AJAX >> NEWPROPS
		// invio le immagini
		// AJAX >> NEWFILES
		APP.TAB.unshift(NEWASSET)
		// ridisegno mappa (entrando su pag.Mappa)
		APP.MAP=false 
		// mostro pulsanti nuovaPosizione e nuovoAsset
		$("#postRegistraWait").hide()
		$("#newId").html(APP.ASSET.Id)		
		$("#postRegistra").show()
		//
		},
	nuovaPosizione:function(){
		APP.ASSET.REGISTRA=false
		APP.ASSET.Coordinate=false
		APP.goPagina("Posizione")
		},
	nuovoAsset:function(){
		APP.ASSET.REGISTRA=false
		APP.goPagina("Aggiungi")
		},
	togRiepilogo:function(){
		$("#riepilogo").toggle()
		},
	SS:function(){
		APP.getAjax("SS.asp","",function(RESULT){
			alert(RESULT.OK)	
			})
		},
	updatePos:function(pos){
		APP.ASSET.ACTUALPOS={
			Precisione:parseFloat(pos.coords.accuracy),
			Lat:parseFloat(pos.coords.latitude),
			Lng:parseFloat(pos.coords.longitude)
			}		
		var latlon = new google.maps.LatLng(APP.ASSET.ACTUALPOS.Lat,APP.ASSET.ACTUALPOS.Lng)
		if(!APP.ASSET.ACTUARLMARK){APP.ASSET.ACTUARLMARK=new google.maps.Marker({
			position:latlon,
			map:APP.MAPPOS,
			icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
			})}
		else{APP.ASSET.ACTUARLMARK.setPosition(latlon);}
		APP.MAPPOS.setCenter(latlon);
		var str=""
		var acc=APP.ASSET.ACTUALPOS.Precisione
		var colore=(acc<=10)?"060":(acc<=15)?"CC0":(acc<=20)?"F60":"F00"
		str+='<div style="background:#'+colore+';color:#fff;padding:5px">Prec.'+acc.toFixed(2)
		str+=' Lat.'+APP.ASSET.ACTUALPOS.Lat.toFixed(5)+' '
		str+=' Lng.'+APP.ASSET.ACTUALPOS.Lng.toFixed(5)+'</div>'
		$("#FieldsPosizione").html(str)
		},
	
	/*
	updatePos:function(pos){
		APP.ASSET.ACTUALPOS={
			Precisione:parseFloat(pos.coords.accuracy),
			Lat:parseFloat(pos.coords.latitude),
			Lng:parseFloat(pos.coords.longitude)
			}		
		var latlon = new google.maps.LatLng(APP.ASSET.ACTUALPOS.Lat,APP.ASSET.ACTUALPOS.Lng)
		if(!APP.ASSET.ACTUARLMARK){APP.ASSET.ACTUARLMARK=new google.maps.Marker({
			position:latlon,
			map:APP.MAPPOS,
			icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
			})}
		else{APP.ASSET.ACTUARLMARK.setPosition(latlon);}
		APP.MAPPOS.setCenter(latlon);
		var str=""
		var acc=APP.ASSET.ACTUALPOS.Precisione
		var colore=(acc<=10)?"060":(acc<=15)?"CC0":(acc<=20)?"F60":"F00"
		str+='<div style="background:#'+colore+';color:#fff;padding:5px">Prec.'+acc.toFixed(2)+' Lat.'+APP.ASSET.ACTUALPOS.Lat.toFixed(5)+' Lng.'+APP.ASSET.ACTUALPOS.Lng.toFixed(5)+'</div>'
		$("#FieldsPosizione").html(str)
		},
	*/
	errorPos:function(err){
		navigator.geolocation.clearWatch(APP.WATCH);
		APP.WATCH=null
		console.warn('ERROR(' + err.code + '): ' + err.message);
		$("#BTNusaPosizione").hide()
		$("#FieldsPosizione").html("<p>"+err.message+"</p>")
		},
	usaPosizione:function(){
		// interrompe geolocazione
		navigator.geolocation.clearWatch(APP.WATCH);
		APP.WATCH=false
		// cabia bottoni
		$("#BTNusaPosizione").hide()
		$("#BTNcorreggiPosizione").show()
		//
		APP.FitZoom(APP.MAPPOS,APP.ASSET.ACTUARLMARK)
		APP.ASSET.Coordinate=APP.ASSET.ACTUALPOS
		APP.chkSTATUS()	
		},
	togAggiungi:function(TIPO){		
		$("#aggiungiPerimetro,#aggiungiAsset").slideToggle()
		},
	Scheda:function(ID){
		APP.SCHEDAID=(ID)	
		APP.goPagina("Scheda")
		},
	MapCorreggiPos:function(){
		// cancella il marker
		APP.ASSET.ACTUARLMARK.setMap(null)		
		// attiva 
		google.maps.event.addListener(APP.MAPPOS,"click",function(event) {
			var lat = event.latLng.lat();
			var lng = event.latLng.lng();
			var latlng = new google.maps.LatLng(lat,lng)
			APP.ASSET.ACTUALPOS={
				Precisione:0,
				Lat:lat,
				Lng:lng
				}
			APP.ASSET.ACTUARLMARK.setPosition(latlng);
			APP.ASSET.ACTUARLMARK.setMap(APP.MAPPOS)
			//APP.MAPPOS.setCenter(latlng);
			var str=""
			str+='<div style="background:#060;color:#fff;padding:5px">Prec.Man. Lat.'+APP.ASSET.ACTUALPOS.Lat.toFixed(5)+' Lng.'+APP.ASSET.ACTUALPOS.Lng.toFixed(5)+'</div>'
			$("#FieldsPosizione").html(str)
			google.maps.event.clearListeners(APP.MAPPOS,"click");
			APP.usaPosizione()
			});		
		},
	MapScegliLayer:function(LAYER){
		APP.LAYER=LAYER
		APP.TAB=false
		APP.MAP=false
		APP.goPagina("Home")
		},
	MapReloadPosition:function(){
		APP.LAT=APP.MAP.center.lat()
		APP.LNG=APP.MAP.center.lng()
		APP.ZOOM=APP.MAP.zoom
		APP.TAB=false
		APP.MAP=false
		APP.GETPOSITION=false
		APP.init.Home()
		},
	MapFitZoom:function(){
		if(APP.ZOOMTYPE=="LAST"){
			APP.FitZoom(APP.MAP,[APP.MARKERS[0]])			
			APP.ZOOMTYPE="ALL"
			}
		else{
			APP.FitZoom(APP.MAP,APP.MARKERS)			
			APP.ZOOMTYPE="LAST"			
			}		
		},
	FitZoom:function(MAPPA,MARKERS){
		if(MARKERS.length>0){
			var BOUNDS = new google.maps.LatLngBounds();
			for(var i=0;i<MARKERS.length;i++){BOUNDS.extend(MARKERS[i].getPosition());}
			MAPPA.fitBounds(BOUNDS);
			}
		},	
	login:function(IN){
		/*
		var lin=$("#usr").val()
		var psw=window.btoa($("#psw").val())
		//$("#inviati").html("Dati inviati:<br>lin="+lin+"<br>pwd="+psw).show()
		$.ajax({
			url: "http://159.122.132.173/ff/home/logint_srvp",
			dataType: "jsonp",
			data:{"lin":lin,"pwd":psw},
			success: function(response){
				//$("#login").html("Login:<br>login="+response.login+"<br>id="+response.id).show()
				var R=response				
				USER.Id=R.id
				USER.Token=R.token
				if(R.login=="true"){
					USER.Logged=true
					$.ajax({
						//url: "http://159.122.132.173/ff/users/user_aclsp",
						dataType: "jsonp",
						data:{"id":R.id,"app":"Urbano"},
						success: function(response) {
							var RR=response
							if(RR.Access=="DENY"){
								//$("#access").html("Accesso: Non consentito per l'applicazione ")
								}
							else{
								$.each(RR,function(i,v){USER[i]=v})
								//$("#access").html("Accesso:<br>"+JSON.stringify(response)).show()
								$.ajax({
									url: "http://159.122.132.173/ff/users/"+R.id+"/showlinp",
									//jsonp: "callback",
									dataType: "jsonp",
									success: function(response) {
										$.each(response,function(i,v){USER[i]=v})
										$("#info").html("Info:<br>"+JSON.stringify(response)).show()
										},
									error:function(x,s,e){
										$("#errori").html("Errore ajax showlin: "+s+" - "+e).show()
										}
									});	
								}
							},
						error:function(x,s,e){
							$("#errori").html("Errore ajax user_acls: "+s+" - "+e).show()
							}
						});		
					APP.goPagina("Home")
					}
				else{
					$("#login").html("Login:<br>Non autorizzato").show()
					}
				},
			error:function(x,s,e){
				$("#errori").html("Errore ajax logint_srvp: "+s+" - "+e).show()
				}
			});		
		*/
		APP.getAjax("login.asp",((IN)?"usr="+$("#usr").val()+"&psw="+$("#psw").val():"logout=logout"),function(RESULT){
			if(RESULT.OK){
				APP.USER=RESULT.OK
				if(APP.USER.Logged){
					APP.goPagina("Home")	
					$("#benvenuto").html(APP.USER.Nome+" Id:"+APP.USER.Id+" Ruolo:"+APP.USER.Ruolo)
					}
				}
			})		
		},
	fast:function(){
		APP.IMMAGINI=[]			// azzera tabella immagini
		APP.MAPPOS=false   		// riazzera mappa posizione
		APP.MARKERS=[]   		// riazzera i marker
		// copia asset default
		APP.ASSET=JSON.parse(JSON.stringify(APP.ASSETDEFAULT))
		APP.ASSET.Categoria="Arredo_urbano"
		APP.ASSET.Tipologia="Lampione"
		APP.goPagina("Immagini")
		}
	}


	
