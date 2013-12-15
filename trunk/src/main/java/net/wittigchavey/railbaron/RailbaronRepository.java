package net.wittigchavey.railbaron;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcOperations;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Repository;

@Repository
public class RailbaronRepository {

	private final List<Destination> destinations;
	private NamedParameterJdbcOperations db;
	

	public RailbaronRepository() {
		
//		String dbName = System.getProperty("RDS_DB_NAME", "railbaron"); 
//		String userName = System.getProperty("RDS_USERNAME", "user"); 
//		String password = System.getProperty("RDS_PASSWORD", "password"); 
//		String hostname = System.getProperty("RDS_HOSTNAME", "192.168.1.8");
//		String port = System.getProperty("RDS_PORT", "3306");
		
		String dbName = System.getProperty("RDS_DB_NAME", "ebdb"); 
		String userName = System.getProperty("RDS_USERNAME", "root"); 
		String password = System.getProperty("RDS_PASSWORD", "password"); 
		String hostname = System.getProperty("RDS_HOSTNAME", "aa18yb84gsgcv4n.czeagjx8cabn.us-west-2.rds.amazonaws.com");
		String port = System.getProperty("RDS_PORT", "3306");
		
		DriverManagerDataSource dataSource = new DriverManagerDataSource () ;
		dataSource.setDriverClassName("com.mysql.jdbc.Driver");
		dataSource.setUrl("jdbc:mysql://"+hostname+":"+port+"/"+dbName);
		dataSource.setUsername(userName);
		dataSource.setPassword(password);
		
		db = new NamedParameterJdbcTemplate (dataSource);
		
		String sql = "select id, name from city";
		RowMapper<Destination> rowMapper = BeanPropertyRowMapper.newInstance(Destination.class);
		destinations = db.query(sql, rowMapper);
	}
	
	public List<Destination> getAllDestinations() {

		return destinations;
	}

	public Integer getPayout(int fromCityId, int toCityId) {

		if (fromCityId == toCityId) {
			return 0;
		}
		
		String sql = "select payoff from new_payoff"
				+ " where (location1 = :fromCityId or location2 = :fromCityId)"
				+ " and (location1 = :toCityId or location2 = :toCityId)";
		Map<String,Object> params = new HashMap<String,Object>();
		params.put("fromCityId", fromCityId);
		params.put("toCityId", toCityId);
		Integer payout = db.queryForObject(sql, params, Integer.class);
		return payout;
	}
	
}
