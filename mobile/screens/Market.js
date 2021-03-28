import React, { useEffect } from "react";
import { Text, StyleSheet, View, Image, Dimensions, ScrollView, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import { globalColors, globalStyles } from "../styles/global";
import { ThemeContext } from "../utils/theme";
import { empty, separateThousands, abbreviateNumber, epoch, wait } from "../utils/utils";

const screenWidth = Dimensions.get("screen").width;
const screenHeight = Dimensions.get("screen").height;

export default function Market({ navigation }) {
	const { theme } = React.useContext(ThemeContext);

	const marketRef = React.createRef();

	const loadingText = "Loading...";

	const [pageKey, setPageKey] = React.useState(epoch());

	const [refreshing, setRefreshing] = React.useState(false);

	const [marketCap, setMarketCap] = React.useState(loadingText);
	const [marketChange, setMarketChange] = React.useState();
	const [volume, setVolume] = React.useState(loadingText);

	const [marketData, setMarketData] = React.useState([<Text key="loading" style={[styles.headerText, styles[`headerText${theme}`]]}>Loading...</Text>]);

	useEffect(() => {
		setInterval(() => {
			if(navigation.isFocused()) {
				getMarket();
				getGlobal();
			}
		}, 15000)
	}, []);

	useEffect(() => {
		setMarketData([<Text key="loading" style={[styles.headerText, styles[`headerText${theme}`]]}>Loading...</Text>]);

		setPageKey(epoch());

		getMarket();
		getGlobal();
	}, [theme]);

	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		getMarket();
		getGlobal();
		wait(2000).then(() => setRefreshing(false));
	}, []);

	return (
		<ScrollView style={[styles.page, styles[`page${theme}`]]} key={pageKey} contentContainerStyle={{ padding:20 }} nestedScrollEnabled={true} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
			<LinearGradient style={[styles.card, { marginBottom:20, marginTop:0 }]} colors={globalColors[theme].colorfulGradient} useAngle={true} angle={45}>
				<Text style={[styles.cardText, styles[`cardText${theme}`]]}>{marketCap} {marketChange}</Text>
			</LinearGradient>
			<ScrollView ref={marketRef} style={[styles.tableWrapper, styles[`tableWrapper${theme}`]]} contentContainerStyle={{ paddingLeft:20, paddingTop:10, paddingBottom:10 }} nestedScrollEnabled={true}>
				{ !empty(marketData) &&
					marketData.map(row => {
						return row;
					})
				}
			</ScrollView>
			<LinearGradient style={[styles.card, { marginTop:20 }]} colors={globalColors[theme].orangeGradient} useAngle={true} angle={45}>
				<Text style={[styles.cardText, styles[`cardText${theme}`]]}>{volume}</Text>
			</LinearGradient>
			<StatusBar style={theme === "Dark" ? "light" : "dark"}/>
		</ScrollView>
	);

	async function getMarket() {
		let theme = empty(await AsyncStorage.getItem("theme")) ? "Light" : await AsyncStorage.getItem("theme");

		let endpoint = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false";

		fetch(endpoint, {
			method: "GET",
			headers: {
				Accept: "application/json", "Content-Type": "application/json"
			}
		})
		.then((response) => {
			return response.json();
		})
		.then(async (coins) => {
			let data = [];

			data.push(
				<View style={styles.row} key={epoch() + "market-header"}>
					<Text style={[styles.headerText, styles[`headerText${theme}`], styles.headerRank]} ellipsizeMode="tail">#</Text>
					<Text style={[styles.headerText, styles[`headerText${theme}`], styles.headerCoin]} ellipsizeMode="tail">Coin</Text>
					<Text style={[styles.headerText, styles[`headerText${theme}`], styles.headerPrice]} ellipsizeMode="tail">Price</Text>
					<Text style={[styles.headerText, styles[`headerText${theme}`], styles.headerCap]} ellipsizeMode="tail">Cap</Text>
				</View>
			);

			let keys = Object.keys(coins);
			keys.sort((a, b) => {
				return coins[keys[b]].market_cap - coins[keys[a]].market_cap;
			});

			let rank = 0;

			keys.map(key => {
				rank += 1;

				let coin = coins[key];
				let price = parseFloat(coin.current_price);
				let cap = separateThousands(abbreviateNumber(parseFloat(coin.market_cap), 2));

				if(price > 1) {
					price = separateThousands(price);
				}

				let icon = coin.image;

				let symbol = coin.symbol.toUpperCase();

				data.push(
					<View style={styles.row} key={epoch() + key}>
						<Text style={[styles.cellText, styles[`cellText${theme}`], styles.cellRank]} ellipsizeMode="tail">{rank}</Text>
						<Image style={styles.cellImage} source={{uri:icon}}/>
						<Text style={[styles.cellText, styles[`cellText${theme}`], styles.cellSymbol]} ellipsizeMode="tail">{symbol}</Text>
						<Text style={[styles.cellText, styles[`cellText${theme}`], styles.cellPrice]} ellipsizeMode="tail">{price}</Text>
						<Text style={[styles.cellText, styles[`cellText${theme}`], styles.cellCap]} ellipsizeMode="tail">{cap}</Text>
					</View>
				);
			});

			if(navigation.isFocused()) {
				setMarketData(data);
			}
		}).catch(error => {
			console.log(error);
		});
	}

	async function getGlobal() {
		let endpoint = "https://api.coingecko.com/api/v3/global";

		fetch(endpoint, {
			method: "GET",
			headers: {
				Accept: "application/json", "Content-Type": "application/json"
			}
		})
		.then((response) => {
			return response.json();
		})
		.then(async (global) => {
			let marketCap = (global.data.total_market_cap.usd).toFixed(0);
			let marketChange = (global.data.market_cap_change_percentage_24h_usd).toFixed(1);
			let volume = (global.data.total_volume.usd).toFixed(0);

			if(screenWidth < 380) {
				marketCap = abbreviateNumber(marketCap, 3);
				volume = abbreviateNumber(volume, 0);
			}
			
			if(navigation.isFocused()) {
				setMarketCap("$" + separateThousands(marketCap));
				setMarketChange("(" + marketChange + "%)");
				setVolume("$" + separateThousands(volume) + " (24h)");
			}
		}).catch(error => {
			console.log(error);
		});
	}
}

const styles = StyleSheet.create({
	page: {
		height:screenHeight - 180,
		backgroundColor:globalColors["Light"].mainSecond,
	},
	pageDark: {
		backgroundColor:globalColors["Dark"].mainSecond
	},
	tableWrapper: {
		backgroundColor:globalColors["Light"].mainFirst,
		shadowColor:globalStyles.shadowColor,
		shadowOffset:globalStyles.shadowOffset,
		shadowOpacity:globalStyles.shadowOpacity,
		shadowRadius:globalStyles.shadowRadius,
		elevation:globalStyles.shadowElevation,
		borderRadius:globalStyles.borderRadius,
		maxHeight:screenHeight - 380,
		height:screenHeight - 380,
	},
	tableWrapperDark: {
		backgroundColor:globalColors["Dark"].mainFirst
	},
	row: {
		flexDirection:"row",
		alignItems:"center",
		paddingLeft:4,
		paddingTop:8,
		paddingBottom:8,
	},
	headerText: {
		fontSize:18,
		fontFamily:globalStyles.fontFamily,
		fontWeight:"bold",
		color:globalColors["Light"].mainContrastLight,
		marginBottom:4,
	},
	headerTextDark: {
		color:globalColors["Dark"].mainContrastLight
	},
	headerRank: {
		width:30
	},
	headerCoin: {
		width:100,
		marginLeft:15,
	},
	headerPrice: {
		width:100,
	},
	cellText: {
		color:globalColors["Light"].mainContrastLight
	},
	cellTextDark: {
		color:globalColors["Dark"].mainContrastLight
	},
	cellRank: {
		width:30
	},
	cellSymbol: {
		width:74
	},
	cellPrice: {
		width:100
	},
	cellImage: {
		width:30,
		height:30,
		marginRight:10,
		borderRadius:15,
	},
	card: {
		shadowColor:globalStyles.shadowColor,
		shadowOffset:globalStyles.shadowOffset,
		shadowOpacity:globalStyles.shadowOpacity,
		shadowRadius:globalStyles.shadowRadius,
		elevation:globalStyles.shadowElevation,
		borderRadius:globalStyles.borderRadius,
		justifyContent:"center",
		alignItems:"center",
		height:60,
		marginTop:20,
	},
	cardText: {
		lineHeight:56,
		paddingBottom:4,
		fontSize:20,
		fontFamily:globalStyles.fontFamily,
		color:globalColors["Light"].accentContrast,
		fontWeight:"bold",
		textAlign:"center"
	},
	cardTextDark: {
		color:globalColors["Dark"].accentContrast
	}
});