$(document).ready(function() {
	$.ajax({
		url: "getAllDestinations.do",
		dataType: "json"
	}).done(function(data){
			for (var i=0;i<data.length;i++){
				$("select.destinations").append(
					'<option value=' + data[i].id + '>'  + data[i].name +'</option>'
				);
			};
		});
	$("#addPlayer").click(function() {//on function click call function (addNewPlayer) to create new player
		$("div.allPlayers").append(
			'<div class="player black">' + $("div.playerTemplate").html() + '</div>'
		);
	});
	$("body").on("click",".addDestination",function(){
		$(this).after(
				'<div class="trip">' + $("div.trip").html() + '</div>'
		);
	});
	$("body").on("change",".color",function(){
		$(this).parent()
			.removeClass("red green blue black white yellow")
			.addClass($(this).children(":selected").val());
	});
	$("body").on("click",".playerColor div", function(){
		$(this).hide();
		var playerParent = $(this).parents(".player");
		var classToRemove = $(this).attr("class");
		playerParent.removeClass(classToRemove);
		
		var classToAdd;
		if ($(this).next().length != 0){
			$(this).next().show();
			classToAdd = $(this).next().attr("class");
			playerParent.addClass(classToAdd);
		} else {
			$(this).parent().children(":first-child").show();
			classToAdd = $(this).parent().children(":first-child").attr("class");
			playerParent.addClass(classToAdd);
		};
	});
	$("body").on("change", ".destinations", function() {
		var changedCityId = $(this).children(":selected").val();
		var cityId1 = $(this).parent(".trip").next().find("option:selected").val();
		var cityId2 = $(this).parent(".trip").prev().find("option:selected").val();
		
		getPayout(changedCityId, cityId1, $(this).parent(".trip").next().find(".payout"));
		getPayout(changedCityId, cityId2, $(this).parent(".trip").find(".payout"));
		
	});
	
/*	var jsonExample = {
		destinations: [{id:1, name:"Albany"},
		               {id:2, name:"Albuquerque"},
		               {id:3, name:"Boston"}],
		stuff: "more stuff",
		something: 123
	};
*/	
	$("body").on("hover", ".payout", function() {
		$(this).next(".destinations").css("font-weight", "bold");
	});
	$("body").on("click", ".payout", function(){
		$(this).toggleClass("unreachable");
	});
	
	$("#addPlayer").click().click();
	$("#statsButton").click(function(){
		$("#modalBackground").css("display", "block");
		$("#statsReadOut").css("display", "block");
		$("#statsReadOut").prepend(
				'<table id = "playerStats">' + $("#playerStatsTemplate").html() + '</table>'
				);
		$(".player").each(function(){
			var playerName = $(this).find(".playername").val();
			var hometown = $(this).find(".destinations :selected").last().html();
			var numTrips = ($(this).find(".trip").size() - 1);
			var numUnreachable = $(this).find(".unreachable").size();
			$("#playerStats").append("<tr><td>" + playerName + "</td><td>" + hometown + "</td><td>" + numTrips + "</td><td>" + numUnreachable + "</td></tr>");
			
			//var numIncome = Number($(this).find(".payout").last().text());
			//console.log(numIncome);
			
		});
	});
	$('#exitStats').click(function(){
		$(this).siblings("#playerStats").remove();
		$("#modalBackground").css("display", "none");
		$(this).parent().css("display", "none");
	});
});

var getPayout = function(cityId1, cityId2, target) {
	$.ajax({
		url: "getPayout.do",
		dataType: "json",
		data: {from: cityId1, to: cityId2}
	}).done(function(data){
		target.html(format(data));
	});
};

var format = function(x) {
    return '$' + x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};