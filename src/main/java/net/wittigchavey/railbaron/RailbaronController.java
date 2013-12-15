package net.wittigchavey.railbaron;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.google.gson.Gson;

@Controller
public class RailbaronController {

	@Autowired
	private RailbaronRepository repository;
	
	@RequestMapping("**/getAllDestinations.do")
	@ResponseBody
	public String getAllDestinations() {
		
		List<Destination> destinations = repository.getAllDestinations();
		Gson gson = new Gson();
		String json = gson.toJson(destinations);
		return json;
	}
	
	@RequestMapping("**/getPayout.do")
	@ResponseBody
	public String getPayout(@RequestParam("from") int fromCityId, @RequestParam("to") int toCityId) {
		
		Integer payout = repository.getPayout(fromCityId, toCityId);
		return payout.toString();
	}
	
}
