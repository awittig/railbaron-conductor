const destinationTableGB = {
    regionChart: {
      odd: {
        2: "White Rose Country",
        3: "White Rose Country",
        4: "Scottish Lowlands",
        5: "Scottish Lowlands",
        6: "White Rose Country",
        7: "Midlands",
        8: "Red Rose Country",
        9: "Midlands",
        10: "Red Rose Country",
        11: "East Anglia",
        12: "Wales"
      },
      even: {
        2: "West Country",
        3: "West Country",
        4: "Home Counties",
        5: "West Country",
        6: "East Anglia",
        7: "Home Counties",
        8: "Wales",
        9: "London",
        10: "Scottish Highlands",
        11: "Scottish Highlands",
        12: "Scottish Highlands"
      }
    },
    destinationCharts: {
      "Scottish Highlands": {
        odd: {
          2: "Wick",
          3: "Oban",
          4: "Oban",
          5: "Inverness",
          6: "Inverness",
          7: "Montrose",
          8: "Aberdeen",
          9: "Aberdeen",
          10: "Fort William",
          11: "Fort William",
          12: "Mallaig"
        },
        even: {
          2: "Wick",
          3: "Kyle of Lochalsh",
          4: "Keith",
          5: "Keith",
          6: "Fraserburgh",
          7: "Dundee",
          8: "Crianlarich",
          9: "Crianlarich",
          10: "Boat of Garten",
          11: "Boat of Garten",
          12: "Mallaig"
        }
      },
      "Scottish Lowlands": {
        odd: {
          2: "Hamilton",
          3: "Perth",
          4: "Perth",
          5: "Perth",
          6: "Hamilton",
          7: "Glasgow",
          8: "Glasgow",
          9: "Glasgow",
          10: "Hamilton",
          11: "Peebles",
          12: "Peebles"
        },
        even: {
          2: "Dumfries",
          3: "Edinburgh",
          4: "Edinburgh",
          5: "Edinburgh",
          6: "Edinburgh",
          7: "Kilmarnock",
          8: "Stirling",
          9: "Stirling",
          10: "Stranraer",
          11: "Dumfries",
          12: "Stranraer"
        }
      },
      "White Rose Country": {
        odd: {
          2: "Berwick",
          3: "Grimsby",
          4: "Berwick",
          5: "Sheffield",
          6: "Sheffield",
          7: "Newcastle",
          8: "Hull",
          9: "Grimsby",
          10: "Doncaster",
          11: "Doncaster",
          12: "Hull"
        },
        even: {
          2: "Scarborough",
          3: "Scarborough",
          4: "Leeds",
          5: "Leeds",
          6: "Leeds",
          7: "York",
          8: "York",
          9: "York",
          10: "Darlington",
          11: "Darlington",
          12: "Hull"
        }
      },
      "Red Rose Country": {
        odd: {
          2: "Tebay",
          3: "Tebay",
          4: "Liverpool",
          5: "Liverpool",
          6: "Liverpool",
          7: "Lancaster",
          8: "Crewe",
          9: "Blackburn",
          10: "Crewe",
          11: "Blackburn",
          12: "Blackburn"
        },
        even: {
          2: "Carlisle",
          3: "Carlisle",
          4: "Carlisle",
          5: "Barrow-in-Furness",
          6: "Whitehaven",
          7: "Lancaster",
          8: "Manchester",
          9: "Manchester",
          10: "Manchester",
          11: "Barrow-in-Furness",
          12: "Whitehaven"
        }
      },
      "Midlands": {
        odd: {
          2: "Nottingham",
          3: "Rugby",
          4: "Nottingham",
          5: "Rugby",
          6: "Birmingham",
          7: "Birmingham",
          8: "Boston",
          9: "Lincoln",
          10: "Derby",
          11: "Derby",
          12: "Stratford-on-Avon"
        },
        even: {
          2: "Craven Arms",
          3: "Craven Arms",
          4: "Hereford",
          5: "Hereford",
          6: "Stafford",
          7: "Leicester",
          8: "Worcester",
          9: "Leicester",
          10: "Worcester",
          11: "Shrewsbury",
          12: "Shrewsbury"
        }
      },
      "Wales": {
        odd: {
          2: "Llanidloes",
          3: "Llanidloes",
          4: "Aberystwyth",
          5: "Aberystwyth",
          6: "Carmarthen",
          7: "Swansea",
          8: "Swansea",
          9: "Wrexham",
          10: "Wrexham",
          11: "Neyland",
          12: "Neyland"
        },
        even: {
          2: "Brecon",
          3: "Brecon",
          4: "Brecon",
          5: "Cardiff",
          6: "Cardiff",
          7: "Bangor",
          8: "Blaenau Ffestiniog",
          9: "Bangor",
          10: "Blaenau Ffestiniog",
          11: "Blaenau Ffestiniog",
          12: "Llanidloes"
        }
      },
      "East Anglia": {
        odd: {
          2: "Yarmouth",
          3: "Yarmouth",
          4: "Yarmouth",
          5: "Cambridge",
          6: "Cambridge",
          7: "Bedford",
          8: "Bedford",
          9: "Ipswich",
          10: "Colchester",
          11: "Ipswich",
          12: "Colchester"
        },
        even: {
          2: "Southend-on-Sea",
          3: "Southend-on-Sea",
          4: "Peterborough",
          5: "Hertford",
          6: "Peterborough",
          7: "Hertford",
          8: "Norwich",
          9: "King's Lynn",
          10: "King's Lynn",
          11: "Norwich",
          12: "Norwich"
        }
      },
      "West Country": {
        odd: {
          2: "Bridgwater",
          3: "Weymouth",
          4: "Bridgwater",
          5: "Weymouth",
          6: "Bristol",
          7: "Plymouth",
          8: "Barnstaple",
          9: "Barnstaple",
          10: "Plymouth",
          11: "Penzance",
          12: "Penzance"
        },
        even: {
          2: "Padstow",
          3: "Padstow",
          4: "Swindon",
          5: "Bournemouth",
          6: "Bournemouth",
          7: "Gloucester",
          8: "Gloucester",
          9: "Salisbury",
          10: "Exeter",
          11: "Exeter",
          12: "Salisbury"
        }
      },
      "Home Counties": {
        odd: {
          2: "Banbury",
          3: "Dover",
          4: "Dover",
          5: "Banbury",
          6: "Brighton",
          7: "Chatham",
          8: "Chatham",
          9: "Hastings",
          10: "Hastings",
          11: "Hastings",
          12: "Canterbury"
        },
        even: {
          2: "Guildford",
          3: "Winchester",
          4: "Winchester",
          5: "Guildford",
          6: "Oxford",
          7: "Southampton",
          8: "Portsmouth",
          9: "Reading",
          10: "Tunbridge Wells",
          11: "Portsmouth",
          12: "Reading"
        }
      }
    }
  };
  