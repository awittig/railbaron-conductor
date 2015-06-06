package net.wittigchavey.railbaron;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcOperations;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class RailbaronRepository {

	private final List<Destination> destinations;

	private final NamedParameterJdbcOperations db;

	@Autowired
	public RailbaronRepository(NamedParameterJdbcOperations db) {

		this.db = db;

		String sql = "select id, name from city";
		RowMapper<Destination> rowMapper = BeanPropertyRowMapper.newInstance(Destination.class);
		this.destinations = this.db.query(sql, rowMapper);
	}
	
	public List<Destination> getAllDestinations() {

		return destinations;
	}

	public Integer getPayout(int fromCityId, int toCityId) {

		if (fromCityId == toCityId) {
			return 0;
		}
		
		String sql = "select payoff from payoff"
				+ " where (location1 = :fromCityId or location2 = :fromCityId)"
				+ " and (location1 = :toCityId or location2 = :toCityId)";
		Map<String,Object> params = new HashMap<String,Object>();
		params.put("fromCityId", fromCityId);
		params.put("toCityId", toCityId);
		Integer payout = db.queryForObject(sql, params, Integer.class);
		return payout;
	}
	
}
