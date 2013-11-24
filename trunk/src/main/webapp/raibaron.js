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
	
/*	var jsonExample = {
		destinations: [{id:1, name:"Albany"},
		               {id:2, name:"Albuquerque"},
		               {id:3, name:"Boston"}],
		stuff: "more stuff",
		something: 123
	};
*/	
	$("#addPlayer").click().click();
});

