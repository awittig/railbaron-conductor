<html>
<head>
	<link rel="stylesheet" type="text/css" href="railbaron.css">
	<script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	<script type="text/javascript" src="raibaron.js">
	</script>
	<script type="text/javascript" src="player.js"></script>
	
</head>

<body>
	<div class="playerTemplate">
		<div class="playerColor">
			<div class="black" style="display:block;"></div>
			<div class="red"></div>
			<div class="blue"></div>
			<div class="green"></div>
			<div class="white"></div>
			<div class="yellow"></div>
		</div>
		<input type="text" class="playerName"  placeholder="Player's Name"/>
		<div class="addDestination button">+</div>
		<div class="trip">
			<div class="payout" title="click if player needs to pay another to complete">&nbsp;</div>
			<select class="destinations">
				<option>Choose a city...</option>
			</select>
		</div>
	</div>	
	<div class="allPlayers">
	</div>
	<div id="addPlayer" class="button">+</div>
	
</body>
</html>
