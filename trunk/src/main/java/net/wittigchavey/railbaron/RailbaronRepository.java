package net.wittigchavey.railbaron;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public class RailbaronRepository {

	public List<Destination> getAllDestinations() {
		
		List<Destination> destinations = new ArrayList<Destination>();

		Destination albany = new Destination();
		albany.setId(1);
		albany.setName("Albany");
		destinations.add(albany);

		Destination albuquerque = new Destination();
		albuquerque.setId(2);
		albuquerque.setName("Albuquerque");
		destinations.add(albuquerque);
		
		Destination boston = new Destination();
		boston.setId(3);
		boston.setName("Boston");
		destinations.add(boston);
		
		return destinations;
	}
	
}
