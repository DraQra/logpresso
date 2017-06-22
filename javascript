(function() {
	app.register.controller('LogViewerController', function LogViewerController($scope, serviceLogdb, $compile) {
		// StringBuffer 함수 정의
		var StringBuffer = function(){
			this.buffer = new Array();
		}

		StringBuffer.prototype.append = function(obj){
			this.buffer.push(obj);	
		}

		StringBuffer.prototype.toString = function(){
			return this.buffer.join("");	
		}
		
		// 쿼리에 자주 쓰이는 기호 정의
		var commonWord = {
			space : ' ',
			equal : '=',
			doubleEqual : '==',
			pipe : ' | ',
			and : ' and ',
			or : ' or ',
			doubleQ : '\"',
			fulltext : 'fulltext',
			table : 'table',
			from : ' from',
			to : ' to',
			limit : 'limit',
			line : 'line',
			duration : 'duration',
			das : '\"DAS2\"',
			eap : '\"R2R\" and FILENAME==\"CMCON\" and FILENAME==\"EAP\"',
			mes : '\"R2R\" and FILENAME==\"CMCON\" and FILENAME==\"MES\"',
			trace : '\"TRACE\"',
			r2r : '\"R2R\" and FILENAME==\"201*\"',
			alarm : '\"alarm*\"',
			eds : '\"eds*\"',
			eis : '\"eis*\"',
			ems : '\"ems*\"',
			his : '\"his*\"',
			mhs : '\"mhs*\"',
			patch : '\"patch*\"',
			query : '\"query*\"',
			rpt : '\"rpt*\"',
			wip : '\"wip*\"',
			filename : 'FILENAME',
			host : '_host',
			star : '*'
		}
		
		//submit시에 넘어오는 인자들 파싱
		function filterOptionParser(serializedArgs){
			
			var argsArray = serializedArgs.split('&');
			var fromDate = argsArray[0].replace('fromDate=','').replace(/\./g, '');
			var fromTime = argsArray[1].replace('fromTime=','').replace(/%3A/g,'');
			var toDate = argsArray[2].replace('toDate=','').replace(/\./g, '');
			var toTime = argsArray[3].replace('toTime=','').replace(/%3A/g,'');
			var interval = argsArray[4].replace('interval=','');
			var system = argsArray[5].replace('system=','');
			var type = argsArray[6].replace('type=','');
			var keyword = argsArray[7].replace('keyword=',''); //keyword 형태(keyword=field1=value1;field2=value2;field3=value3)
			var pageNum = argsArray[8].replace('pageNum=','');
			var rowNum = argsArray[9].replace('rowNum=','');
			var keywordArray = keyword.split('%3B');	
			var fromMergedTime;
			var toMergedTime;
			
			//시간 값이 없을시에 현재 시간 기준으로 10분전으로 세팅
			if(fromDate=='' || fromTime==''){
				var time = new Date();
				if(Number(time.getMinutes())>=10){
					fromMergedTime = time.getFullYear()+time.getHours()+(Number(time.getMinutes())-10)+time.getSeconds();
				}else{
					fromMergedTime = time.getFullYear()+(time.getHours()-1)+(60+Number(time.getMinutes())-10)+time.getSeconds();
				}
			}else{
				fromMergedTime = fromDate + fromTime;
			}
			
			//시간 값이 없을시에 현재 시간 기준으로 세팅
			if(toDate=='' || toTime==''){
				var time = new Date();
				toMergedTime = time.getFullYear()+time.getHours()+time.getMinutes()+time.getSeconds();
			}else{
				toMergedTime = toDate + toTime;
			}
			
			// ''일 경우 system default를 apc로 설정, 
			if(system=='' || system=='all'){
				system = 'apc_data, mes_data';
			}else{
				system += '_data';
			}
			
			var parsedArgs = {
				argsArray :	argsArray,
				fromTime : fromMergedTime,
				toTime : toMergedTime,
				interval : interval,
				system : system,
				type : type,
				keyword : keywordArray,
				rowNum : rowNum,
				pageNum : pageNum
			}
			
			return parsedArgs;
		}
		
		//submit을 통해 넘어오는 인자들로 쿼리 구성
		function queryManager(args){
			
			var parsedArgs = filterOptionParser(args);
			var query = commonWord.fulltext;
			var strBuffer = new StringBuffer();
			
			
			//type, keyword 없을 경우 default 쿼리문
			if((parsedArgs.type==''||parsedArgs.type=='all') && parsedArgs.keyword==''){
				var query = '';
				strBuffer.append(commonWord.table);
				
				//time 설정
				if(parsedArgs.interval == 'none' || parsedArgs.interval == 'Duration' || parsedArgs.interval == ''){
					//from=, to= 시간 설정 
					strBuffer.append(commonWord.from);
					strBuffer.append(commonWord.equal);
					strBuffer.append(parsedArgs.fromTime);
					strBuffer.append(commonWord.to);
					strBuffer.append(commonWord.equal);
					strBuffer.append(parsedArgs.toTime);
				}else{
					//기간 단위 시간 설정
					strBuffer.append(commonWord.space);
					strBuffer.append(commonWord.duration);
					strBuffer.append(commonWord.equal);
					strBuffer.append(parsedArgs.interval);
				}
				
				//table 설정
				strBuffer.append(commonWord.space);
				strBuffer.append(parsedArgs.system);
				
				//limit 설정
				if(parsedArgs.pageNum=='1'){
					strBuffer.append(commonWord.pipe);
					strBuffer.append(commonWord.limit);
					strBuffer.append(commonWord.space);
					strBuffer.append(parsedArgs.rowNum);
				}else{
					var offset = ""+(Number(parsedArgs.rowNum)*(Number(parsedArgs.pageNum)-1));
					strBuffer.append(commonWord.pipe);
					strBuffer.append(commonWord.limit);
					strBuffer.append(commonWord.space);
					strBuffer.append(offset);
					strBuffer.append(commonWord.space);
					strBuffer.append(parsedArgs.rowNum);
				}
				
				query += strBuffer.toString();
				console.log('query(queryManager) : ' + query);
				return query;
			}
			
			//time 설정
			if(parsedArgs.interval == 'none'|| parsedArgs.interval == 'Duration' || parsedArgs.interval == ''){
				//from=, to= 시간 설정 
				strBuffer.append(commonWord.from);
				strBuffer.append(commonWord.equal);
				strBuffer.append(parsedArgs.fromTime);
				strBuffer.append(commonWord.to);
				strBuffer.append(commonWord.equal);
				strBuffer.append(parsedArgs.toTime);
			}else{
				//기간 단위 시간 설정
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.duration);
				strBuffer.append(commonWord.equal);
				strBuffer.append(parsedArgs.interval);
			}
			
			//type설정
			if(parsedArgs.type=='all'){
			}else if(parsedArgs.type=='das'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.filename);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.das);
			}else if(parsedArgs.type=='eap'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.filename);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.eap);
			}else if(parsedArgs.type=='mes'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.filename);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.mes);
			}else if(parsedArgs.type=='trace'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.filename);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.trace);
			}else if(parsedArgs.type=='r2r'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.filename);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.r2r);
			}else if(parsedArgs.type=='alarm'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.alarm);
			}else if(parsedArgs.type=='eds'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.eds);
			}else if(parsedArgs.type=='eis'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.eis);
			}else if(parsedArgs.type=='ems'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.ems);
			}else if(parsedArgs.type=='his'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.his);
			}else if(parsedArgs.type=='mhs'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.mhs);
			}else if(parsedArgs.type=='patch'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.patch);
			}else if(parsedArgs.type=='query'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.query);
			}else if(parsedArgs.type=='rpt'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.rpt);
			}else if(parsedArgs.type=='wip'){
				strBuffer.append(commonWord.space);
				strBuffer.append(commonWord.host);
				strBuffer.append(commonWord.doubleEqual);
				strBuffer.append(commonWord.wip);
			}
			
			
			//keyword 설정
			var keywordArraySize = parsedArgs.keyword.length;
			console.log('keywordArraySize : ' + keywordArraySize);
			var keywordArray = parsedArgs.keyword;
			var tmpArray = new Array();
			for(var i=0;i<keywordArraySize;i++){
				tmpArray = keywordArray[i].split('%3D');	// '=' → '%3D' 유니코드 
				
				if(keywordArraySize==1){
					if(tmpArray[0]==''){
						break;
					}else{
						if(parsedArgs.type!='all' && parsedArgs.type!=''){
							strBuffer.append(commonWord.and);
							strBuffer.append(commonWord.space);
							strBuffer.append(tmpArray[0].toUpperCase());
							strBuffer.append(commonWord.doubleEqual);
							strBuffer.append(commonWord.doubleQ);
							strBuffer.append(tmpArray[1]);
							strBuffer.append(commonWord.doubleQ);
						}else{
							strBuffer.append(commonWord.space);
							strBuffer.append(tmpArray[0].toUpperCase());
							strBuffer.append(commonWord.doubleEqual);
							strBuffer.append(commonWord.doubleQ);
							strBuffer.append(tmpArray[1]);
							strBuffer.append(commonWord.doubleQ);
						}
					}
				}else{
					if(i==0){
						strBuffer.append(commonWord.space);
						strBuffer.append(tmpArray[0].toUpperCase());
						strBuffer.append(commonWord.doubleEqual);
						strBuffer.append(commonWord.doubleQ);
						strBuffer.append(tmpArray[1]);
						strBuffer.append(commonWord.doubleQ);
						strBuffer.append(commonWord.and);
					}else if(i==(keywordArraySize-1)){
						strBuffer.append(tmpArray[0].toUpperCase());
						strBuffer.append(commonWord.doubleEqual);
						strBuffer.append(commonWord.doubleQ);
						strBuffer.append(tmpArray[1]);
						strBuffer.append(commonWord.doubleQ);
					}else{
						strBuffer.append(tmpArray[0].toUpperCase());
						strBuffer.append(commonWord.doubleEqual);
						strBuffer.append(commonWord.doubleQ);
						strBuffer.append(tmpArray[1]);
						strBuffer.append(commonWord.doubleQ);
						strBuffer.append(commonWord.and);
					}
				}
			}
			
			//table 설정
			strBuffer.append(commonWord.from);
			strBuffer.append(commonWord.space);
			strBuffer.append(parsedArgs.system);
			
			//limit 설정
			if(parsedArgs.pageNum=='1'){
				strBuffer.append(commonWord.pipe);
				strBuffer.append(commonWord.limit);
				strBuffer.append(commonWord.space);
				strBuffer.append(parsedArgs.rowNum);
			}else{
				var offset = ""+(Number(parsedArgs.rowNum)*(Number(parsedArgs.pageNum)-1));
				strBuffer.append(commonWord.pipe);
				strBuffer.append(commonWord.limit);
				strBuffer.append(commonWord.space);
				strBuffer.append(offset);
				strBuffer.append(commonWord.space);
				strBuffer.append(parsedArgs.rowNum);
			}
			//임시 limit 설정
			/*strBuffer.append(commonWord.pipe);
			strBuffer.append(commonWord.limit);
			strBuffer.append(commonWord.space);
			strBuffer.append('1000');*/
			
			query += strBuffer.toString();
			
			console.log('query(queryManager) : ' + query);
			return query;
		}

		var instance;	//serviceLogdb 인스턴스
		var pid = Math.floor(Math.random() * 1000) + 1;
		// 쿼리를 인자로 로그프레소에 데이터 조회
		function getResult(query){
			
			if(instance != undefined) {
				serviceLogdb.remove(instance);
			}
			
			instance = undefined;
			
			if(query != ''){
				instance = serviceLogdb.create(pid);
				var startTime = new Date();
				var startTimeMilliSeconds = Number(startTime.getSeconds())*1000 + Number(startTime.getMilliseconds());
				//최대 5000개 조회
				var q = instance.query(query, 5000);
				q.created(function (m){
					
				}).onTail(function (helper){
					helper.getResult(function (m){
						//Elapsed Time 기재
						var finishTime = new Date();
						var finishTimeMilliSeconds = Number(finishTime.getSeconds())*1000 + Number(finishTime.getMilliseconds());
						$("#laptime").text((Number(finishTimeMilliSeconds) - Number(startTimeMilliSeconds)));
						$("#rowCount").text(m.body.count);
						$scope.result = m.body.result;
						if($scope.result[0] != undefined && $scope.result[0] != null){
							console.log('query result fields : ' + Object.keys($scope.result[0]));
						}
						
						console.log('query result count : ' + m.body.count);
						$scope.$apply();
						data = $scope.result;
						dataView.setItems(data); 
						grid = new Slick.Grid("#myGrid", dataView, columns, options);
						grid.invalidate();
					    grid.render();
					    if(m.body.count=='0'){
					    	$("#myGrid").html('<div id="noRecords" class="alert-info-grid">No Record(s) Found</div>');
					    }
					    
					});
				}).failed(function (m, raw){
					console.log('query failed', m, raw);
				});
			}
	
		}
		
		//검색 버튼
		$(".ui.form").on('submit', function(e){
    		console.log('interval : ' +  $('#intervalTime').dropdown('get value'));
			e.preventDefault();
    		var data = $(".ui.form input").serialize();  // or serialize();
    		console.log(data);
    		
    		//system에 맞게 grid header 변경
    		updateGridColumns($("#system").val());
    		/*console.log('system : ' + $("#system").val() + ', columns : ' + JSON.stringify(columns));*/
    		
    		getResult(queryManager(data));
    		
    	});
		
		//dynamic Dropdown 0621 수정
		$("#sysDropdown").change(function(){
			var sys = $("#sysDropdown").dropdown('get value');
			if (sys == "apc") {
				$("#typeDropdown").dropdown('clear');
				$("#typeDropdown").dropdown({'set value':'apc'});
				$("#typeDropdown .menu").html(
						'<div class="item" data-value="all">ALL</div>' +
						'<div class="item" data-value="das">DAS</div>' +
					    '<div class="item" data-value="eap">EAP</div>' +
					  	'<div class="item" data-value="mes">MES</div>' +
					    '<div class="item" data-value="trace">TRACE</div>' +
					    '<div class="item" data-value="r2r">R2R</div>'			
				);
				$("#typeDropdown").dropdown();
			}else if (sys =="mes") {
				$("#typeDropdown").dropdown('clear');
				$("#typeDropdown").dropdown({'set value':'mes'});
				$("#typeDropdown .menu").html(
						'<div class="item" data-value="all">ALL</div>' +
						'<div class="item" data-value="alarm">ALARM</div>' +
					    '<div class="item" data-value="eds">EDS</div>' +
					  	'<div class="item" data-value="eis">EIS</div>' +
					    '<div class="item" data-value="his">HIS</div>' +
					    '<div class="item" data-value="mhs">MHS</div>' +
					    '<div class="item" data-value="patch">PATCH</div>' +
					    '<div class="item" data-value="query">QUERY</div>' +
					    '<div class="item" data-value="rpt">RPT</div>' +
					    '<div class="item" data-value="wip">WIP</div>'			
				);
				$("#typeDropdown").dropdown();
			}else if (sys =="all") {
				$("#typeDropdown").dropdown('clear');
				$("#typeDropdown").dropdown({'set value':'all'});
				$("#typeDropdown .menu").html(
						'<div class="item" data-value="all">ALL</div>' +
						'<div class="item" data-value="das">DAS</div>' +
					    '<div class="item" data-value="eap">EAP</div>' +
					  	'<div class="item" data-value="mes">MES</div>' +
					    '<div class="item" data-value="trace">TRACE</div>' +
					    '<div class="item" data-value="r2r">R2R</div>' +
						'<div class="item" data-value="alarm">ALARM</div>' +
					    '<div class="item" data-value="eds">EDS</div>' +
					  	'<div class="item" data-value="eis">EIS</div>' +
					    '<div class="item" data-value="his">HIS</div>' +
					    '<div class="item" data-value="mhs">MHS</div>' +
					    '<div class="item" data-value="patch">PATCH</div>' +
					    '<div class="item" data-value="query">QUERY</div>' +
					    '<div class="item" data-value="rpt">RPT</div>' +
					    '<div class="item" data-value="wip">WIP</div>'			
				);
				$("#typeDropdown").dropdown();
			}
		});
		//dynamic Dropdown 0621
    	
    	/* date time picker */
        $( "#fromDate" ).datepicker({
            onClose: function( selectedDate ) {
                $( "#toDate" ).datepicker( "option", "minDate", selectedDate );
            },
            showOn: "button",
            buttonImage: "./styles/images/form/calendar.jpg",
            buttonImageOnly: true,
            buttonText: "Select date",
            dateFormat: "yy.mm.dd",
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true
        });
		
        $( "#toDate" ).datepicker({
            /* defaultDate: "+1w", */
            onClose: function( selectedDate ) {
                $( "#fromDate" ).datepicker( "option", "maxDate", selectedDate );
            },
            showOn: "button",
            buttonImage: "./styles/images/form/calendar.jpg",
            buttonImageOnly: true,
            buttonText: "Select date",
            dateFormat: "yy.mm.dd",
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true
        });
        
        $('.timepicker1').timepicker({
            timeFormat: 'HH:mm:ss',
            interval: 10,
            minTime: '0',
            maxTime: '11:59pm',
            startTime: '0',
            dynamic: false,
            dropdown: true,
            scrollbar: true
        });
        
        $('.timepicker2').timepicker({
            timeFormat: 'HH:mm:ss',
            interval: 10,
            minTime: '0',
            maxTime: '11:59pm',
            defaultTime: 'now',
            startTime: '0',
            dynamic: false,
            dropdown: true,
            scrollbar: true
        });
        
        $("#currentTime").click(function(){
        	$("#fromDate").datepicker("setDate", new Date());
        	$("#toDate").datepicker("setDate", new Date());
        	//from time 설정
			$(".timepicker1").timepicker("setTime", getTenMinutesAgo());
			//to time 설정
        	$(".timepicker2").timepicker("setTime", new Date());
        	$("#intervalTime").dropdown('clear');
        });
        $("#toDate").datepicker("setDate", new Date());
        
        //드롭다운 메뉴 이벤트 등록
        $('.dropdown').dropdown();
        
        // 이전 페이지 조회
    	$(".ui.left.blue.button").click(function(){
    		var page = Number($("#pageNum").val())- 1; // 이전 페이지 
    		if(page < 1){  // 최소 값 = 1
    			page = 1;
    		}
    		$("#pageNum").val(page); // 이전 페이지
    		$("#pageTxt").text(page); // 이전 페이지 표시
    		$("#logSearchBtn").trigger('click');
    	});
    	
    	// 다음 페이지 조회
    	$(".ui.right.blue.button").click(function(){
    		var page = Number($("#pageNum").val()) + 1;  // 다음 페이지 
    		$("#pageNum").val(page); // 다음 페이지
    		$("#pageTxt").text(page); // 다음 페이지 표시
    		$("#logSearchBtn").trigger('click');
    	});
        
        /* SlickGrid */
		var grid;
		var dataView= new Slick.Data.DataView({ inlineFilters: true }); 
		var data = [];
		//system 변경시마다 column 재조정 필요
		var columns = [];
		
		function dayFormatter(row, cell, value, columnDef, dataContext) {
		    return value + ' days';
		}
		
		function dateFormatter(row, cell, value, columnDef, dataContext) {
		    return value.getMonth() + '/' + value.getDate() + '/' + value.getFullYear();
		}
		var options = {
			enableCellNavigation: true,
			forceFitColumns: false,
			autoExpandColumns : true,
			topPanelHeight: 30,
			enableColumnReorder: false
		};
		
		/*grid.onClick.subscribe(function (e, args) {
			var cell = args.cell;
		    var rowIdx = args.row;
		    if(rowIdx === undefined) return; // 선택된 row 없을시 return 
		    var row = data[rowIdx]; // 전체 row 데이터
		    console.log('row : ' + row);
		    var field = grid.getColumns()[cell].field; // 선택한 필드 명
		    var value = row[field]; // 선택한 cell value
		    var key = row["key"]; // key 값
		});*/
		
		function init(){
			
			$("#fromDate").datepicker("setDate", new Date());
        	$("#toDate").datepicker("setDate", new Date());
			//from time 설정
			$(".timepicker1").timepicker("setTime", getTenMinutesAgo());
			//to time 설정
        	$(".timepicker2").timepicker("setTime", new Date());
        	$("#myGrid").empty().html('<div id="noRecords" class="alert-info-grid">No Record(s) Found</div>');
		}
		
		function updateGridColumns (system){
			
			if($("#system").val()==="all" || $("#system").val()===""){
				columns = [
        		    { id: "TIME_EX", name: "TIME", field: "TIME_EX", minWidth: 120, sortable: true },
        		    { id: "ACTION", name: "ACTION", field: "ACTION", minWidth: 120, sortable: true},
        		    { id: "CACHEDJOBINFO", name: "CACHEDJOBINFO", field: "CACHEDJOBINFO", minWidth: 120, sortable: true },
        		    { id: "EQPID", name: "EQPID", field: "EQPID", width: 130, minWidth: 130, sortable: true },
        		    { id: "INTERFACE", name: "INTERFACE", field: "INTERFACE", width: 130, minWidth: 130, sortable: true },
        		    { id: "METHOD", name: "METHOD", field: "METHOD", width: 130, minWidth: 130, sortable: true },
        		    { id: "QUERY", name: "QUERY", field: "QUERY", minWidth: 110, sortable: true },
        		    { id: "VARIABLES", name: "VARIABLES", field: "VARIABLES", minWidth: 110, sortable: true },
         		    { id: "CLASSINFO", name: "CLASSINFO", field: "CLASSINFO", minWidth: 120, sortable: true},
         		    { id: "CN", name: "CN", field: "CN", minWidth: 120, sortable: true },
         		    { id: "LEVEL", name: "LEVEL", field: "LEVEL", width: 130, minWidth: 130, sortable: true },
         		    { id: "LOGTYPE", name: "LOGTYPE", field: "LOGTYPE", width: 130, minWidth: 130, sortable: true },
         		    { id: "PKG", name: "PKG", field: "PKG", width: 130, minWidth: 130, sortable: true },
         		    { id: "THREADID", name: "THREADID", field: "THREADID", minWidth: 110, sortable: true },
         		    { id: "TRANSACTIONID", name: "TRANSACTIONID", field: "TRANSACTIONID", minWidth: 110, sortable: true },
         		    { id: "TEXT", name: "TEXT", field: "TEXT", minWidth: 110, sortable: true }
        		];
			}else if($("#system").val()==="apc"){
				columns = [
        		    { id: "TIME_EX", name: "TIME", field: "TIME_EX", minWidth: 120, sortable: true },
        		    { id: "ACTION", name: "ACTION", field: "ACTION", minWidth: 120, sortable: true},
        		    { id: "CACHEDJOBINFO", name: "CACHEDJOBINFO", field: "CACHEDJOBINFO", minWidth: 120, sortable: true },
        		    { id: "EQPID", name: "EQPID", field: "EQPID", width: 130, minWidth: 130, sortable: true },
        		    { id: "METHOD", name: "METHOD", field: "METHOD", width: 130, minWidth: 130, sortable: true },
        		    { id: "INTERFACE", name: "INTERFACE", field: "INTERFACE", width: 130, minWidth: 130, sortable: true },
        		    { id: "QUERY", name: "QUERY", field: "QUERY", minWidth: 110, sortable: true },
        		    { id: "VARIABLES", name: "VARIABLES", field: "VARIABLES", minWidth: 110, sortable: true },
        		    { id: "TEXT", name: "TEXT", field: "TEXT", minWidth: 110, sortable: true }
        		];
			}else if($("#system").val()==="mes"){
				columns = [
        			{ id: "TIME_EX", name: "TIME", field: "TIME_EX", minWidth: 120, sortable: true },
         		    { id: "CLASSINFO", name: "CLASSINFO", field: "CLASSINFO", minWidth: 120, sortable: true},
         		    { id: "CN", name: "CN", field: "CN", minWidth: 120, sortable: true },
         		    { id: "LEVEL", name: "LEVEL", field: "LEVEL", width: 130, minWidth: 130, sortable: true },
         		    { id: "LOGTYPE", name: "LOGTYPE", field: "LOGTYPE", width: 130, minWidth: 130, sortable: true },
         		    { id: "PKG", name: "PKG", field: "PKG", width: 130, minWidth: 130, sortable: true },
         		    { id: "THREADID", name: "THREADID", field: "THREADID", minWidth: 110, sortable: true },
         		    { id: "TRANSACTIONID", name: "TRANSACTIONID", field: "TRANSACTIONID", minWidth: 110, sortable: true },
         		    { id: "TEXT", name: "TEXT", field: "TEXT", minWidth: 110, sortable: true }
        		];
			}
		}
		
		$(function () {
			init();
			
		    /*grid = new Slick.Grid("#myGrid", data, columns, options);
		    grid.onSort.subscribe(function (e, args) {
			    var cols = args.sortCols;
			    data.sort(function (dataRow1, dataRow2) {
			        for (var i = 0, l = cols.length; i < l; i++) {
			          var field = cols[i].sortCol.field;
			          var sign = cols[i].sortAsc ? 1 : -1;
			          var value1 = dataRow1[field], value2 = dataRow2[field];
			          var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
			          if (result != 0) {
			            return result;
			          }
			        }
			        return 0;
			    });
			    grid.invalidate();
			    grid.render();
		    });*/
		});
		
		//엑셀 다운로드 버튼 클릭시
		$("#downloadExcel").click(function(){
			downloadExcel(data);
		});
		
		//시간 객체 반환
		function getTenMinutesAgo(){
			var time = new Date();
			
			return new Date(Date.parse(time) - 1 * 1000 * 60 *10 );
		}
		
		/* 170619 Duration 변경 이벤트 */
        // lpad 
        function leadingZeros(n, digits) {
          var zero = '';
          n = n.toString();
          if (n.length < digits) {
            for (i = 0; i < digits - n.length; i++)
              zero += '0';							//digit(자리수)보다 n의 자리수가 작으면 해당 자리수만큼 0을 zero문자열에 append
          }
          return zero + n;
        }
        
     // 시간 포멧 변경 date -> string (ex 13:10:50)
        function getTimeStamp(d,liter) {
          var s =
            leadingZeros(d.getHours(), 2) + liter +
            leadingZeros(d.getMinutes(), 2) + liter +
            leadingZeros(d.getSeconds(), 2);
          return s;
        }
        
      //interval 드롭다운 time 클릭 이벤트
        $("#intervalTime").change(function(){
        	var intervalData = $('#intervalTime').dropdown('get value');
			console.log(intervalData);
			
			switch(intervalData) {
			case "1m":
				var d = new Date();
				var curTime = getTimeStamp(d,"")
				var oneMinutesAgo = getTimeStamp(new Date(Date.parse(d) -1 * 1000 * 60 * 1 ),"");
				$(".timepicker1").timepicker("setTime", oneMinutesAgo);
				$(".timepicker2").timepicker("setTime", d);
				break;
			case "10m":
				var d = new Date();
				var curTime = getTimeStamp(d,"")
				var tenMinutesAgo = getTimeStamp(new Date(Date.parse(d) -1 * 1000 * 60 * 10 ),"");
				$(".timepicker1").timepicker("setTime", tenMinutesAgo);
				$(".timepicker2").timepicker("setTime", d);
				break;
			case "30m":
				var d = new Date();
				var curTime = getTimeStamp(d,"")
				var thirtyMinutesAgo = getTimeStamp(new Date(Date.parse(d) -1 * 1000 * 60 * 30 ),"");
				$(".timepicker1").timepicker("setTime", thirtyMinutesAgo);
				$(".timepicker2").timepicker("setTime", d);
				break;
			case "1h":
				var d = new Date();
				var curTime = getTimeStamp(d,"")
				var oneHoursAgo = getTimeStamp(new Date(Date.parse(d) -1 * 1000 * 60 * 60 ),"");
				$(".timepicker1").timepicker("setTime", oneHoursAgo);
				$(".timepicker2").timepicker("setTime", d);
				break;
			case "1d":
				var d = new Date();
				var curTime = getTimeStamp(d,"")
				var oneDaysAgo = new Date(Date.parse(d) - 1 * 1000 * 60 * 60 * 24 );
				$("#fromDate").datepicker("setDate", oneDaysAgo);
				$(".timepicker1").timepicker("setTime", new Date());
				$(".timepicker2").timepicker("setTime", new Date());
				break;
			}
			
        });
        /* 170619 Duration 변경 이벤트 */
		
		// Internet Explorer 체크
		function isMsie() {
			var isIE = true;
		    var ua = window.navigator.userAgent;
		    var msie = ua.indexOf("MSIE ");

		    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  // If Internet Explorer, return version number
		    {
		        console.log(parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))));
		        isIE=true;
		    }
		    else  // If another browser, return 0
		    {
		    	console.log('otherbrowser');
		        isIE = false;
		    }
		    return isIE;
		}
		
		//엑셀 다운로드
		function downloadExcel(data){
			var date = new Date();
			var today = date.getFullYear()+""+leadingZeros((date.getMonth()+1),2)+""+date.getDate();
			JSONToCSVConvertor(data, today+"_log_exported", true,["key","_time"]);
		}

		// 엑셀다운로드
		function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel,exclude) {
		    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
		    var CSV = '';    

		    CSV += ReportTitle + '\r\n\n';

		    if (ShowLabel) {
		        var row = "";

		        for (var index in arrData[0]) {
		        	if($.inArray( index, exclude ) == -1){
		        		row += index + ',';
		        	}
		        }

		        row = row.slice(0, -1);
		        CSV += row + '\r\n';
		    }

		    for (var i = 0; i < arrData.length; i++) {
		        var row = "";

		        for (var index in arrData[i]) {
		        	if($.inArray( index, exclude ) == -1){
		        		row += '" ' + (arrData[i][index]==null?'':arrData[i][index])+ ' ",';
		        	}
		        }

		        row.slice(0, row.length - 1);
		        CSV += row + '\r\n';
		    }

		    if (CSV == '') {        
		        alert("Invalid data");
		        return;
		    }   

		    var fileName = "";
		    fileName += ReportTitle.replace(/ /g,"_");   
		    /*if (isMsie()) { // 인터넷 익스플로러
		    	var IEwindow = window.open("", "_blank", "left="+(screen.width*2)+",top=0, width=1,height=1");
		    	IEwindow.document.write('sep=,\r\n' + CSV);
		    	IEwindow.document.close();
		    	IEwindow.document.execCommand('SaveAs', true, fileName + ".csv");
		    	IEwindow.close();
		    }else{	// 기타 브라우저 ( 크롬 , 파이어폭스 등.. )
		    	var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
		    	var link = document.createElement("a");    
		    	link.href = uri;
		    	link.style = "visibility:hidden";
		    	link.download = fileName + ".csv";
		    	document.body.appendChild(link);
		    	link.click();
		    	document.body.removeChild(link);
		    }*/
		    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
	    	var link = document.createElement("a");    
	    	link.href = uri;
	    	link.style = "visibility:hidden";
	    	link.download = fileName + ".csv";
	    	document.body.appendChild(link);
	    	link.click();
	    	document.body.removeChild(link);
		}
	});
})();
 
//# sourceURL=apps/logViewer/logViewer/app.js
