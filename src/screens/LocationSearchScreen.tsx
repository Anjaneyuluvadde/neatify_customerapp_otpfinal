// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import * as Location from 'expo-location';
// import React, { useEffect, useState } from 'react';
// import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { useTheme } from '../context/ThemeContext';
// import { supabase } from '../lib/supabase';
// import LocationService, { LocationResult } from '../services/LocationService';
// import { COLORS } from '../theme/colors';

// export default function LocationSearchScreen() {
//   const navigation = useNavigation<any>();
//   const { theme } = useTheme();

//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<Location.LocationGeocodedLocation[]>([]);
//   const [isSearching, setIsSearching] = useState(false);

//   const [savedProfile, setSavedProfile] = useState<{ address: string | null } | null>(null);

//   const [isFetchingCurrent, setIsFetchingCurrent] = useState(false);
//   const [fetchedLocation, setFetchedLocation] = useState<LocationResult | null>(null);

//   useEffect(() => {
//     fetchProfileAddress();
//   }, []);

//   const fetchProfileAddress = async () => {
//     const { data: { session } } = await supabase.auth.getSession();
//     if (session) {
//       const { data } = await supabase
//         .from('profile')
//         .select('address')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (data) {
//         setSavedProfile(data);
//       }
//     }
//   };

//   const handleSearch = async (text: string) => {
//     setSearchQuery(text);
//     console.log(`[LOCATION SEARCH] Search query: ${text}`);
//     if (text.length > 2) {
//       setIsSearching(true);
//       try {
//         const results = await Location.geocodeAsync(text);
//         setSearchResults(results);
//       } catch (error) {
//         console.warn("Geocode error:", error);
//       } finally {
//         setIsSearching(false);
//       }
//     } else {
//       setSearchResults([]);
//     }
//   };

//   const selectSearchResult = async (coords: Location.LocationGeocodedLocation) => {
//     console.log(`[LOCATION SEARCH] Selected location: ${JSON.stringify(coords)}`);
//     setIsSearching(true);
//     try {
//       const addressList = await Location.reverseGeocodeAsync({
//         latitude: coords.latitude,
//         longitude: coords.longitude
//       });
//       if (addressList.length > 0) {
//         const addr = addressList[0];
//         const locality = LocationService.getLocalityString(addr);
//         const fullAddress = [addr.name, addr.street, locality, addr.region, addr.country]
//           .filter(Boolean)
//           .join(", ");

//         const resolvedPincode = addr.postalCode || "";
//         console.log(`[LOCATION SEARCH] Resolved pincode: ${resolvedPincode}`);

//         let isServiceable = false;

//         if (resolvedPincode) {
//           const cleanedPin = resolvedPincode.trim();
//           console.log(`[LOCATION SEARCH] Checking hub_locations for pincode: ${cleanedPin}`);

//           if (cleanedPin.length === 6) {
//             const { data, error } = await supabase
//               .from("hub_locations")
//               .select("id, hub_name, pincode, is_active")
//               .eq("pincode", cleanedPin)
//               .eq("is_active", true)
//               .limit(1);

//             if (error) {
//               console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//               isServiceable = false;
//             } else {
//               const available = Array.isArray(data) && data.length > 0;
//               console.log(`[LOCATION SEARCH] Matching active hubs: ${data ? data.length : 0}`);
//               if (available) {
//                 console.log("[LOCATION SEARCH] Final: AVAILABLE");
//                 isServiceable = true;
//               } else {
//                 console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//                 isServiceable = false;
//               }
//             }
//           } else {
//             console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//           }
//         } else {
//           console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//         }

//         const result: LocationResult = {
//           locality,
//           fullAddress,
//           latitude: coords.latitude,
//           longitude: coords.longitude,
//           status: isServiceable ? 'success' : 'unserviceable',
//           postalCode: resolvedPincode || null,
//           isServiceable: isServiceable,
//           rawAddress: addr
//         };
//         await LocationService.setSelectedLocation(result);

//         if (isServiceable) {
//           Alert.alert("✓ Service Available", "You can continue with booking.", [
//             { text: "OK", onPress: () => navigation.goBack() }
//           ]);
//         } else {
//           Alert.alert("Service Not Available", "We will be available soon in your area.");
//         }
//       }
//     } catch (e) {
//       console.warn("Reverse geocode error:", e);
//       Alert.alert("Error", "An unexpected error occurred. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleUseCurrentLocation = async () => {
//     setIsFetchingCurrent(true);
//     setFetchedLocation(null);
//     try {
//       // Pass true to force GPS fetch, bypassing any cached manual location
//       const result = await LocationService.fetchCurrentLocation(Location.Accuracy.High, true);

//       if (result.status === 'success') {
//         setFetchedLocation(result);
//         await LocationService.setSelectedLocation(result);
//         navigation.goBack();
//       } else if (result.status === 'services_disabled') {
//         Alert.alert("Location Disabled", "Please enable location services in your device settings.");
//       } else if (result.status === 'permission_denied') {
//         Alert.alert("Permission Denied", "Please grant location permissions to use this feature.");
//       } else {
//         Alert.alert("Error", "Failed to get current location. Please try searching manually.");
//       }
//     } catch (e) {
//       console.warn("Error fetching current location:", e);
//       Alert.alert("Error", "An unexpected error occurred while fetching location.");
//     } finally {
//       setIsFetchingCurrent(false);
//     }
//   };

//   const handleAddAddress = () => {
//     // Navigate to Profile tab for address entry
//     navigation.navigate("MainTabs", { screen: "ProfileTab" });
//   };

//   const handleSelectSavedAddress = async () => {
//     if (savedProfile?.address) {
//       try {
//         setIsSearching(true);
//         const results = await Location.geocodeAsync(savedProfile.address);
//         if (results.length > 0) {
//           await selectSearchResult(results[0]);
//         } else {
//           // Fallback if geocoding fails
//           const result: LocationResult = {
//             locality: "Saved Address",
//             fullAddress: savedProfile.address,
//             latitude: 0,
//             longitude: 0,
//             status: 'success',
//             postalCode: null,
//             isServiceable: true,
//             rawAddress: null
//           };
//           await LocationService.setSelectedLocation(result);
//           navigation.goBack();
//         }
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsSearching(false);
//       }
//     }
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
//       <KeyboardAvoidingView 
//         style={{ flex: 1 }} 
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         {/* Header */}
//         <View style={[styles.header, { backgroundColor: theme.background }]}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color={theme.text} />
//           </TouchableOpacity>
//           <Text style={[styles.headerTitle, { color: theme.text }]}>Search your location</Text>
//         </View>

//         <ScrollView 
//           contentContainerStyle={styles.content}
//           keyboardShouldPersistTaps="handled"
//         >
//         {/* Search Input */}
//         <View style={styles.searchContainer}>
//           <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
//           <TextInput
//             style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surfaceVariant }]}
//             placeholder="Search locality, sector, area"
//             placeholderTextColor={theme.textMuted}
//             value={searchQuery}
//             onChangeText={handleSearch}
//           />
//           {isSearching && (
//             <ActivityIndicator size="small" color={COLORS.saffron} style={{ position: 'absolute', right: 16 }} />
//           )}
//         </View>

//         {/* Search Results */}
//         {searchResults.length > 0 && (
//           <View style={styles.searchResultsContainer}>
//             {searchResults.map((result, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={styles.searchResultItem}
//                 onPress={() => selectSearchResult(result)}
//               >
//                 <Ionicons name="location-outline" size={20} color={theme.textMuted} style={{ marginRight: 12 }} />
//                 <Text style={{ color: theme.text }}>Location at {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         )}

//         {/* Empty State */}
//         {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
//           <View style={{ padding: 16, alignItems: 'center' }}>
//             <Text style={{ color: theme.textMuted, fontSize: 15 }}>No locations found</Text>
//           </View>
//         )}

//         {/* Use current location */}
//         <TouchableOpacity style={styles.actionRow} onPress={handleUseCurrentLocation} disabled={isFetchingCurrent}>
//           <Ionicons name="locate" size={22} color={COLORS.saffron} />
//           <View style={{ flex: 1 }}>
//             <Text style={[styles.actionText, { color: COLORS.saffron }]}>
//               {isFetchingCurrent ? "Fetching location..." : "Use current location"}
//             </Text>
//           </View>
//           {isFetchingCurrent ? (
//             <ActivityIndicator size="small" color={COLORS.saffron} />
//           ) : (
//             <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
//           )}
//         </TouchableOpacity>

//         {/* Fetched Location Display */}
//         {fetchedLocation && (
//           <TouchableOpacity style={styles.fetchedLocationContainer} onPress={() => navigation.goBack()}>
//             <Text style={[styles.fetchedLocationTitle, { color: theme.text }]}>
//               Current Location Selected
//             </Text>
//             <Text style={[styles.fetchedLocationText, { color: theme.textMuted }]}>
//               {fetchedLocation.fullAddress}
//             </Text>
//           </TouchableOpacity>
//         )}

//         {/* Add address */}
//         <TouchableOpacity style={styles.actionRow} onPress={handleAddAddress}>
//           <Ionicons name="add" size={22} color={COLORS.saffron} />
//           <Text style={[styles.actionText, { color: COLORS.saffron }]}>Add address</Text>
//           <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
//         </TouchableOpacity>

//         {/* Saved Addresses Section */}
//         {savedProfile?.address && (
//           <View style={styles.savedAddressesSection}>
//             <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SAVED ADDRESSES</Text>

//             <TouchableOpacity style={styles.addressItem} onPress={handleSelectSavedAddress}>
//               <Ionicons name="home-outline" size={20} color={theme.text} style={styles.addressIcon} />
//               <View style={styles.addressDetails}>
//                 <Text style={[styles.addressLabel, { color: theme.text }]}>Saved Address</Text>
//                 <Text style={[styles.addressText, { color: theme.textLight }]} numberOfLines={2}>
//                   {savedProfile.address}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         )}
//       </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   content: {
//     padding: 16,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   searchIcon: {
//     position: 'absolute',
//     left: 16,
//     zIndex: 1,
//   },
//   searchInput: {
//     flex: 1,
//     height: 48,
//     borderRadius: 8,
//     paddingLeft: 44,
//     paddingRight: 40,
//     fontSize: 15,
//   },
//   searchResultsContainer: {
//     marginBottom: 24,
//   },
//   searchResultItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   actionText: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 12,
//   },
//   fetchedLocationContainer: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: '#F1F5F9',
//     borderRadius: 8,
//     marginTop: -8,
//     marginBottom: 16,
//   },
//   fetchedLocationTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   fetchedLocationText: {
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   savedAddressesSection: {
//     marginTop: 32,
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: '600',
//     letterSpacing: 0.5,
//     marginBottom: 16,
//   },
//   addressItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   addressIcon: {
//     marginRight: 16,
//   },
//   addressDetails: {
//     flex: 1,
//   },
//   addressLabel: {
//     fontSize: 15,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   addressText: {
//     fontSize: 13,
//   }
// });



























// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import * as Location from 'expo-location';
// import React, { useEffect, useRef, useState } from 'react';
// import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// import { useTheme } from '../context/ThemeContext';
// import { useAuthGuard } from '../hooks/useAuthGuard';
// import { supabase } from '../lib/supabase';
// import LocationService, { LocationResult } from '../services/LocationService';
// import { COLORS } from '../theme/colors';

// export default function LocationSearchScreen() {
//   const navigation = useNavigation<any>();
//   const { theme } = useTheme();
//   const { checkAuth } = useAuthGuard();        // ← ADD THIS LINE


//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<any[]>([]);
//   const [isSearching, setIsSearching] = useState(false);

//   const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   const [savedProfile, setSavedProfile] = useState<{ address: string | null } | null>(null);

//   const [isFetchingCurrent, setIsFetchingCurrent] = useState(false);
//   const [fetchedLocation, setFetchedLocation] = useState<LocationResult | null>(null);

//   useEffect(() => {
//     fetchProfileAddress();
//   }, []);

//   const fetchProfileAddress = async () => {
//     const { data: { session } } = await supabase.auth.getSession();
//     if (session) {
//       const { data } = await supabase
//         .from('profile')
//         .select('address')
//         .eq('id', session.user.id)
//         .maybeSingle();
//       if (data) {
//         setSavedProfile(data);
//       }
//     }
//   };

//   const handleSearch = (text: string) => {
//     setSearchQuery(text);

//     // Clear the previous timer
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     if (text.length > 2) {
//       setIsSearching(true);

//       // Wait 800ms after the user stops typing
//       searchTimeoutRef.current = setTimeout(async () => {
//         try {
//           // 1. Get the coordinates using the native OS geocoder
//           const geocodeResults = await Location.geocodeAsync(text);

//           if (geocodeResults.length === 0) {
//             setSearchResults([]);
//             setIsSearching(false);
//             return;
//           }

//           // 2. Take the top 4 results to keep it fast
//           const topResults = geocodeResults.slice(0, 4);

//           // 3. Convert those coordinates into human-readable addresses!
//           const formattedResults = await Promise.all(
//             topResults.map(async (coords) => {
//               const addressArray = await Location.reverseGeocodeAsync({
//                 latitude: coords.latitude,
//                 longitude: coords.longitude
//               });

//               let placeName = `Location at ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

//               if (addressArray.length > 0) {
//                 const addr = addressArray[0];
//                 // Combine available address details into a nice string
//                 placeName = [addr.name, addr.street, addr.city || addr.subregion, addr.region]
//                   .filter(Boolean) // removes empty/null values
//                   .join(", ");
//               }

//               return {
//                 latitude: coords.latitude,
//                 longitude: coords.longitude,
//                 name: placeName,
//               };
//             })
//           );

//           setSearchResults(formattedResults);
//         } catch (error) {
//           console.warn("Search error:", error);
//           setSearchResults([]);
//         } finally {
//           setIsSearching(false);
//         }
//       }, 800);
//     } else {
//       setSearchResults([]);
//       setIsSearching(false);
//     }
//   };
//   const selectSearchResult = async (coords: Location.LocationGeocodedLocation) => {
//     console.log(`[LOCATION SEARCH] Selected location: ${JSON.stringify(coords)}`);
//     setIsSearching(true);
//     try {
//       const addressList = await Location.reverseGeocodeAsync({
//         latitude: coords.latitude,
//         longitude: coords.longitude
//       });
//       if (addressList.length > 0) {
//         const addr = addressList[0];
//         const locality = LocationService.getLocalityString(addr);
//         const fullAddress = [addr.name, addr.street, locality, addr.region, addr.country]
//           .filter(Boolean)
//           .join(", ");

//         const resolvedPincode = addr.postalCode || "";
//         console.log(`[LOCATION SEARCH] Resolved pincode: ${resolvedPincode}`);

//         let isServiceable = false;

//         if (resolvedPincode) {
//           const cleanedPin = resolvedPincode.trim();
//           console.log(`[LOCATION SEARCH] Checking hub_locations for pincode: ${cleanedPin}`);

//           if (cleanedPin.length === 6) {
//             const { data, error } = await supabase
//               .from("hub_locations")
//               .select("id, hub_name, pincode, is_active")
//               .eq("pincode", cleanedPin)
//               .eq("is_active", true)
//               .limit(1);

//             if (error) {
//               console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//               isServiceable = false;
//             } else {
//               const available = Array.isArray(data) && data.length > 0;
//               console.log(`[LOCATION SEARCH] Matching active hubs: ${data ? data.length : 0}`);
//               if (available) {
//                 console.log("[LOCATION SEARCH] Final: AVAILABLE");
//                 isServiceable = true;
//               } else {
//                 console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//                 isServiceable = false;
//               }
//             }
//           } else {
//             console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//           }
//         } else {
//           console.log("[LOCATION SEARCH] Final: NOT_AVAILABLE");
//         }

//         const result: LocationResult = {
//           locality,
//           fullAddress,
//           latitude: coords.latitude,
//           longitude: coords.longitude,
//           status: isServiceable ? 'success' : 'unserviceable',
//           postalCode: resolvedPincode || null,
//           isServiceable: isServiceable,
//           rawAddress: addr
//         };
//         await LocationService.setSelectedLocation(result);

//         if (isServiceable) {
//           Alert.alert("✓ Service Available", "You can continue with booking.", [
//             { text: "OK", onPress: () => navigation.goBack() }
//           ]);
//         } else {
//           Alert.alert("Service Not Available", "We will be available soon in your area.");
//         }
//       }
//     } catch (e) {
//       console.warn("Reverse geocode error:", e);
//       Alert.alert("Error", "An unexpected error occurred. Please try again.");
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleUseCurrentLocation = async () => {
//     setIsFetchingCurrent(true);
//     setFetchedLocation(null);
//     try {
//       // Pass true to force GPS fetch, bypassing any cached manual location
//       const result = await LocationService.fetchCurrentLocation(Location.Accuracy.High, true);

//       if (result.status === 'success') {
//         setFetchedLocation(result);
//         await LocationService.setSelectedLocation(result);
//         navigation.goBack();
//       } else if (result.status === 'services_disabled') {
//         Alert.alert("Location Disabled", "Please enable location services in your device settings.");
//       } else if (result.status === 'permission_denied') {
//         Alert.alert("Permission Denied", "Please grant location permissions to use this feature.");
//       } else {
//         Alert.alert("Error", "Failed to get current location. Please try searching manually.");
//       }
//     } catch (e) {
//       console.warn("Error fetching current location:", e);
//       Alert.alert("Error", "An unexpected error occurred while fetching location.");
//     } finally {
//       setIsFetchingCurrent(false);
//     }
//   };

//   // const handleAddAddress = () => {
//   //   // Navigate to Profile tab for address entry
//   //   navigation.navigate("MainTabs", { screen: "ProfileTab" });
//   // };


//   const handleAddAddress = async () => {
//     const isAuth = await checkAuth("add your address");
//     if (!isAuth) return;

//     // Navigate to Profile tab for address entry
//     navigation.navigate("MainTabs", { screen: "ProfileTab" });
//   };

//   const handleSelectSavedAddress = async () => {
//     if (savedProfile?.address) {
//       try {
//         setIsSearching(true);
//         const results = await Location.geocodeAsync(savedProfile.address);
//         if (results.length > 0) {
//           await selectSearchResult(results[0]);
//         } else {
//           // Fallback if geocoding fails
//           const result: LocationResult = {
//             locality: "Saved Address",
//             fullAddress: savedProfile.address,
//             latitude: 0,
//             longitude: 0,
//             status: 'success',
//             postalCode: null,
//             isServiceable: true,
//             rawAddress: null
//           };
//           await LocationService.setSelectedLocation(result);
//           navigation.goBack();
//         }
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsSearching(false);
//       }
//     }
//   };

//   return (
//     <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         {/* Header */}
//         <View style={[styles.header, { backgroundColor: theme.background }]}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color={theme.text} />
//           </TouchableOpacity>
//           <Text style={[styles.headerTitle, { color: theme.text }]}>Search your location</Text>
//         </View>

//         <ScrollView
//           contentContainerStyle={styles.content}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Search Input */}
//           <View style={styles.searchContainer}>
//             <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
//             <TextInput
//               style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surfaceVariant }]}
//               placeholder="Search locality, sector, area"
//               placeholderTextColor={theme.textMuted}
//               value={searchQuery}
//               onChangeText={handleSearch}
//             />
//             {isSearching && (
//               <ActivityIndicator size="small" color={COLORS.saffron} style={{ position: 'absolute', right: 16 }} />
//             )}
//           </View>

//           {/* Search Results */}
//           {searchResults.length > 0 && (
//             <View style={styles.searchResultsContainer}>
//               {searchResults.map((result, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={styles.searchResultItem}
//                   onPress={() => selectSearchResult(result)}
//                 >
//                   <Ionicons name="location-outline" size={20} color={theme.textMuted} style={{ marginRight: 12 }} />
//                   <View style={{ flex: 1 }}>
//                     <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>
//                       {result.name}
//                     </Text>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}

//           {/* Empty State */}
//           {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
//             <View style={{ padding: 16, alignItems: 'center' }}>
//               <Text style={{ color: theme.textMuted, fontSize: 15 }}>No locations found</Text>
//             </View>
//           )}

//           {/* Use current location */}
//           <TouchableOpacity style={styles.actionRow} onPress={handleUseCurrentLocation} disabled={isFetchingCurrent}>
//             <Ionicons name="locate" size={22} color={COLORS.saffron} />
//             <View style={{ flex: 1 }}>
//               <Text style={[styles.actionText, { color: COLORS.saffron }]}>
//                 {isFetchingCurrent ? "Fetching location..." : "Use current location"}
//               </Text>
//             </View>
//             {isFetchingCurrent ? (
//               <ActivityIndicator size="small" color={COLORS.saffron} />
//             ) : (
//               <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
//             )}
//           </TouchableOpacity>

//           {/* Fetched Location Display */}
//           {fetchedLocation && (
//             <TouchableOpacity style={styles.fetchedLocationContainer} onPress={() => navigation.goBack()}>
//               <Text style={[styles.fetchedLocationTitle, { color: theme.text }]}>
//                 Current Location Selected
//               </Text>
//               <Text style={[styles.fetchedLocationText, { color: theme.textMuted }]}>
//                 {fetchedLocation.fullAddress}
//               </Text>
//             </TouchableOpacity>
//           )}

//           {/* Add address */}
//           <TouchableOpacity style={styles.actionRow} onPress={handleAddAddress}>
//             <Ionicons name="add" size={22} color={COLORS.saffron} />
//             <Text style={[styles.actionText, { color: COLORS.saffron }]}>Add address</Text>
//             <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
//           </TouchableOpacity>

//           {/* Saved Addresses Section */}
//           {savedProfile?.address && (
//             <View style={styles.savedAddressesSection}>
//               <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SAVED ADDRESSES</Text>

//               <TouchableOpacity style={styles.addressItem} onPress={handleSelectSavedAddress}>
//                 <Ionicons name="home-outline" size={20} color={theme.text} style={styles.addressIcon} />
//                 <View style={styles.addressDetails}>
//                   <Text style={[styles.addressLabel, { color: theme.text }]}>Saved Address</Text>
//                   <Text style={[styles.addressText, { color: theme.textLight }]} numberOfLines={2}>
//                     {savedProfile.address}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   content: {
//     padding: 16,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   searchIcon: {
//     position: 'absolute',
//     left: 16,
//     zIndex: 1,
//   },
//   searchInput: {
//     flex: 1,
//     height: 48,
//     borderRadius: 8,
//     paddingLeft: 44,
//     paddingRight: 40,
//     fontSize: 15,
//   },
//   searchResultsContainer: {
//     marginBottom: 24,
//   },
//   searchResultItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F1F5F9',
//   },
//   actionText: {
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 12,
//   },
//   fetchedLocationContainer: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     backgroundColor: '#F1F5F9',
//     borderRadius: 8,
//     marginTop: -8,
//     marginBottom: 16,
//   },
//   fetchedLocationTitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   fetchedLocationText: {
//     fontSize: 13,
//     lineHeight: 18,
//   },
//   savedAddressesSection: {
//     marginTop: 32,
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: '600',
//     letterSpacing: 0.5,
//     marginBottom: 16,
//   },
//   addressItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   addressIcon: {
//     marginRight: 16,
//   },
//   addressDetails: {
//     flex: 1,
//   },
//   addressLabel: {
//     fontSize: 15,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   addressText: {
//     fontSize: 13,
//   }
// });











import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { supabase } from '../lib/supabase';
import LocationService, { LocationResult } from '../services/LocationService';
import { COLORS } from '../theme/colors';

export default function LocationSearchScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { checkAuth } = useAuthGuard();
  const insets = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map States
  const [region, setRegion] = useState<Region>({
    latitude: 17.3850,
    longitude: 78.4867,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("Move map to select location...");
  const [currentPincode, setCurrentPincode] = useState<string | null>(null);
  const [currentRawAddress, setCurrentRawAddress] = useState<any>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  // 1. Changed to an array to hold all addresses (Home, Work, Other)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Address Details Modal State (Kept exactly as it was)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressTag, setAddressTag] = useState<"Home" | "Work" | "Other">("Home");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    handleUseCurrentLocation();

    // 2. Fetch all addresses from the new table instead of just the profile
    const fetchAllAddresses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', session.user.id);

        if (data) setSavedAddresses(data);
      }
    };
    fetchAllAddresses();
  }, []);

  // --- 1. SEARCH BAR LOGIC ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const geocodeResults = await Location.geocodeAsync(text);
          if (geocodeResults.length === 0) {
            setSearchResults([]);
            return;
          }

          const topResults = geocodeResults.slice(0, 4);
          const formattedResults = await Promise.all(
            topResults.map(async (coords) => {
              const addressArray = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
              let placeName = `Location at ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
              if (addressArray.length > 0) {
                const addr = addressArray[0];
                placeName = [addr.name, addr.street, addr.city || addr.subregion, addr.region].filter(Boolean).join(", ");
              }
              return { latitude: coords.latitude, longitude: coords.longitude, name: placeName };
            })
          );
          setSearchResults(formattedResults);
        } catch (error) {
          console.warn("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 800);
    } else {
      setSearchResults([]);
    }
  };

  const onSelectSearchResult = (result: any) => {
    setSearchQuery(result.name);
    setSearchResults([]);
    mapRef.current?.animateToRegion({
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  // --- 2. QUICK CHIP HANDLERS ---
  const handleAddAddress = async () => {
    const isAuth = await checkAuth("add your address");
    if (!isAuth) return;
    navigation.navigate("MainTabs", { screen: "ProfileTab" } as any);
  };

  const handleSelectSavedAddress = async (addressString: string) => {
    try {
      const results = await Location.geocodeAsync(addressString);
      if (results.length > 0) {
        mapRef.current?.animateToRegion({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      } else {
        Alert.alert("Notice", "Could not locate the saved address precisely. Please search manually.");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // --- 3. MAP DRAG LOGIC ---
  const onRegionChangeComplete = async (newRegion: Region) => {
    setIsMapMoving(false);
    setRegion(newRegion);
    setCurrentAddress("Fetching address...");

    try {
      const addressArray = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude
      });

      if (addressArray.length > 0) {
        const addr = addressArray[0];
        const locality = LocationService.getLocalityString(addr);
        const fullAddress = [addr.name, addr.street, locality, addr.region, addr.country].filter(Boolean).join(", ");

        setCurrentAddress(fullAddress);
        setCurrentPincode(addr.postalCode || null);
        setCurrentRawAddress(addr);
      } else {
        setCurrentAddress("Unknown Location");
      }
    } catch (e) {
      setCurrentAddress("Could not fetch address");
    }
  };

  // --- 4. CONFIRM BUTTON LOGIC ---
  const handleConfirmLocation = async () => {
    setIsConfirming(true);
    try {
      let isServiceable = false;
      const cleanedPin = currentPincode?.trim() || "";

      if (cleanedPin.length === 6) {
        const { data, error } = await supabase
          .from("hub_locations")
          .select("id")
          .eq("pincode", cleanedPin)
          .eq("is_active", true)
          .limit(1);

        if (!error && data && data.length > 0) {
          isServiceable = true;
        }
      }

      if (isServiceable) {
        setShowAddressModal(true); // Pops open the Modal
      } else {
        Alert.alert("Service Not Available", `We currently do not serve pincode: ${cleanedPin || "this area"}.`);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to verify location.");
    } finally {
      setIsConfirming(false);
    }
  };

  // --- 5. SAVE FINAL ADDRESS & PROFILE ---
  const handleSaveFinalAddress = async () => {
    if (!houseNo.trim()) {
      Alert.alert("Required", "Please enter your House / Flat / Block No.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const prefix = `${addressTag}: ${houseNo.trim()}`;
      const mid = landmark.trim() ? `, ${landmark.trim()}` : "";
      const finalFullAddress = `${prefix}${mid}, ${currentAddress}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {

        // 1. Delete ANY existing addresses with this tag (Cleans up all old duplicates!)
        await supabase
          .from('user_addresses')
          .delete()
          .eq('user_id', session.user.id)
          .eq('tag', addressTag);

        // 2. Insert the fresh, updated address
        await supabase.from('user_addresses').insert({
          user_id: session.user.id,
          tag: addressTag,
          house_no: houseNo.trim(),
          landmark: landmark.trim(),
          full_address: finalFullAddress,
          latitude: region.latitude,
          longitude: region.longitude,
          pincode: currentPincode
        });

        // 3. ONLY if it is Home, also update the master profile table
        if (addressTag === "Home") {
          await supabase
            .from('profile')
            .update({ address: finalFullAddress })
            .eq('id', session.user.id);
        }
      }

      const locality = currentRawAddress ? LocationService.getLocalityString(currentRawAddress) : "Selected Location";
      const result: LocationResult = {
        locality,
        fullAddress: finalFullAddress,
        latitude: region.latitude,
        longitude: region.longitude,
        status: 'success',
        postalCode: currentPincode,
        isServiceable: true,
        rawAddress: currentRawAddress
      };

      await LocationService.setSelectedLocation(result);

      setShowAddressModal(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Could not save address to profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } catch (e) {
      console.warn("Could not get current location.", e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Full Screen Map */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          onRegionChange={() => setIsMapMoving(true)}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
        />

        {/* Center Pin Overlay */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={styles.pinBubble}>
            <Text style={styles.pinBubbleText}>
              {isMapMoving ? "Moving..." : "Set Location"}
            </Text>
          </View>
          <Ionicons name="location" size={44} color={COLORS.saffron} style={styles.pinIcon} />
        </View>

        {/* Floating Top UI (Back Button & Search) */}
        <View style={styles.topOverlay}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.background }]}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.searchBox, { backgroundColor: theme.background }]}>
              <Ionicons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search location..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {isSearching && <ActivityIndicator size="small" color={COLORS.saffron} />}
            </View>
          </View>

          {/* Quick Action Chips (Saved Addresses) */}
          {searchResults.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginLeft: 60 }}>
              
              {/* Dynamically render a chip for every saved address */}
              {savedAddresses.map((addr, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.chipBtn}
                  onPress={() => handleSelectSavedAddress(addr.full_address)}
                >
                  <Ionicons
                    name={addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'briefcase' : 'location'}
                    size={18}
                    color={COLORS.saffron}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>
                    {addr.tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <View style={[styles.resultsCard, { backgroundColor: theme.background }]}>
              {searchResults.map((res, i) => (
                <TouchableOpacity key={i} style={styles.resultItem} onPress={() => onSelectSearchResult(res)}>
                  <Ionicons name="location-outline" size={20} color={theme.textMuted} style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, color: theme.text, fontSize: 13 }} numberOfLines={2}>{res.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Floating Current Location Button */}
        <TouchableOpacity style={[styles.myLocationBtn, { backgroundColor: theme.background }]} onPress={handleUseCurrentLocation}>
          <Ionicons name="locate" size={24} color={COLORS.saffron} />
        </TouchableOpacity>

        {/* Floating Bottom UI (Address Details & Confirm) */}
        <View style={[styles.bottomOverlay, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 20) + 90 }]}>
          <Text style={[styles.addressTitle, { color: theme.text }]}>Selected Location</Text>
          <Text style={[styles.addressText, { color: theme.textMuted }]} numberOfLines={2}>
            {currentAddress}
          </Text>

          <TouchableOpacity
            style={[styles.confirmBtn, { opacity: isMapMoving ? 0.6 : 1 }]}
            onPress={handleConfirmLocation}
            disabled={isMapMoving || isConfirming}
          >
            {isConfirming ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- THE FIX: NATIVE MODAL WITH SCROLLVIEW --- */}
        <Modal visible={showAddressModal} transparent animationType="slide" onRequestClose={() => setShowAddressModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={[styles.modalContent, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 20) + 20, maxHeight: '80%' }]}>

                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Enter Complete Address</Text>
                    <TouchableOpacity onPress={() => setShowAddressModal(false)} style={{ padding: 4 }}>
                      <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 16 }}>{currentAddress}</Text>

                  <TextInput
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border }]}
                    placeholder="House / Flat / Block No. *"
                    placeholderTextColor={theme.textMuted}
                    value={houseNo}
                    onChangeText={setHouseNo}
                  />
                  <TextInput
                    style={[styles.inputField, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Landmark (Optional)"
                    placeholderTextColor={theme.textMuted}
                    value={landmark}
                    onChangeText={setLandmark}
                  />

                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 12, marginBottom: 10 }}>Save as</Text>
                  <View style={styles.tagsRow}>
                    {(['Home', 'Work', 'Other'] as const).map(tag => (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.tagBtn,
                          { borderColor: addressTag === tag ? COLORS.saffron : theme.border },
                          addressTag === tag && { backgroundColor: COLORS.saffron + '1A' }
                        ]}
                        onPress={() => setAddressTag(tag)}
                      >
                        <Ionicons
                          name={tag === 'Home' ? 'home' : tag === 'Work' ? 'briefcase' : 'location'}
                          size={16}
                          color={addressTag === tag ? COLORS.saffron : theme.textMuted}
                        />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: addressTag === tag ? COLORS.saffron : theme.textMuted, marginLeft: 6 }}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* THIS IS THE BUTTON YOU WILL CLICK TO FINALLY SAVE IT! */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveFinalAddress}
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                  </TouchableOpacity>
                </ScrollView>

              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  resultsCard: {
    marginTop: 8,
    marginLeft: 60,
    borderRadius: 16,
    padding: 8,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -22,
    marginTop: -44,
    alignItems: 'center',
  },
  pinBubble: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  pinBubbleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pinIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 260,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmBtn: {
    backgroundColor: COLORS.saffron,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveBtn: {
    backgroundColor: COLORS.saffron,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  }
});