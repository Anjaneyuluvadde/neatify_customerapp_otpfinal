// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from "react-native";
// import { Image } from "expo-image";
// import { useNavigation } from "@react-navigation/native";
// import Animated, { 
//   FadeInDown, 
//   FadeInUp, 
//   useAnimatedStyle, 
//   useSharedValue, 
//   withRepeat, 
//   withSequence, 
//   withTiming,
//   withSpring
// } from "react-native-reanimated";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from '@expo/vector-icons';

// import { COLORS } from "../theme/colors";
// import NeatifyLogo from "../../assets/images/neatifylogo.png";
// import { supabase } from "../lib/supabase";
// import LocationService, { LocationResult } from "../services/LocationService";

// export default function ComingSoonScreen() {
//   const navigation = useNavigation<any>();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 768;

//   // Animation values
//   const buttonScale = useSharedValue(1);
//   const characterBob = useSharedValue(0);

//   const [hubLocations, setHubLocations] = useState<any[]>([]);

//   useEffect(() => {
//     // 3D character bobbing animation
//     characterBob.value = withRepeat(
//       withSequence(
//         withTiming(-6, { duration: 1800 }),
//         withTiming(0, { duration: 1800 })
//       ),
//       -1,
//       true
//     );

//     // Fetch active hub locations
//     const fetchLocations = async () => {
//       const { data, error } = await supabase
//         .from('hub_locations')
//         .select('hub_name, location_name, pincode')
//         .eq('is_active', true);
      
//       if (data && !error) {
//         const unique = new Map<string, any>();
//         for (const row of data) {
//           const name = row.location_name || row.hub_name;
//           const key = `${name}-${row.pincode}`;
//           if (!unique.has(key)) {
//             unique.set(key, { name, pincode: row.pincode });
//           }
//         }
//         // Show all active unique locations
//         setHubLocations(Array.from(unique.values()));
//       }
//     };
//     fetchLocations();
//   }, []);

//   const characterAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ translateY: characterBob.value }],
//     };
//   });

//   const buttonAnimatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: buttonScale.value }],
//     };
//   });

//   const handlePressIn = () => { buttonScale.value = withSpring(0.96); };
//   const handlePressOut = () => { buttonScale.value = withSpring(1); };

//   const handleCheckAgain = () => {
//     // Go back to the LocationAccessScreen to trigger a fresh GPS check
//     navigation.replace("LocationAccess");
//   };

//   const handleLocationPress = async (hub: any) => {
//     // Reconstruct a simple location result for the selected hub
//     const loc: Partial<LocationResult> = {
//       locality: hub.name,
//       fullAddress: `${hub.name}, ${hub.pincode}`,
//       latitude: 17.4065, // Default/fallback for map behavior if needed
//       longitude: 78.4772,
//       postalCode: hub.pincode,
//       isServiceable: true,
//       status: 'success'
//     };
//     await LocationService.setSelectedLocation(loc as LocationResult);
//     navigation.reset({
//       index: 0,
//       routes: [{ name: "HomeDrawer" }],
//     });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Background Decorators */}
//       <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
//         <View style={styles.bgCircleTop} />
//         <View style={styles.bgCircleBottom} />
//       </View>

//       <ScrollView 
//         contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
//         showsVerticalScrollIndicator={false}
//       >
        
//         {/* LOGO */}
//         <Animated.View entering={FadeInUp.duration(600).delay(50)} style={styles.logoContainer}>
//           <Image source={NeatifyLogo} style={styles.logo} contentFit="contain" />
//         </Animated.View>

//         {/* HERO SECTION */}
//         <View style={styles.heroSection}>
//           <Animated.View entering={FadeInDown.duration(600).delay(100)} style={characterAnimatedStyle}>
//             <Image 
//               source={require("../../assets/images/heroimg.png")} 
//               style={styles.characterImage}
//               contentFit="contain"
//             />
//           </Animated.View>

//           <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.textContainer}>
//             <Text style={styles.title}>We're coming soon! 📍</Text>
//             <Text style={styles.subtitle}>
//              The Neatify Team isn't available in your area yet.
//             </Text>
//             <Text style={styles.desc}>
//               Please try a different location to find available services near you.
//             </Text>
//           </Animated.View>
//         </View>

//         {/* LOCATIONS SECTION */}
//         {hubLocations.length > 0 && (
//           <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.locationsSection}>
//             <Text style={styles.locationsTitle}>Try These Locations</Text>
            
//             <View style={styles.grid}>
//               {hubLocations.map((hub, idx) => (
//                 <TouchableOpacity 
//                   key={idx} 
//                   style={styles.locationCard}
//                   activeOpacity={0.7}
//                   onPress={() => handleLocationPress(hub)}
//                 >
//                   <View style={styles.iconContainer}>
//                     <Ionicons name="location-outline" size={22} color={COLORS.saffron} />
//                   </View>
//                   <Text style={styles.locationName} numberOfLines={1}>{hub.name}</Text>
//                   <Text style={styles.locationPincode}>{hub.pincode}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </Animated.View>
//         )}

//         {/* ACTIONS */}
//         <View style={styles.actionContainer}>
//           <Animated.View entering={FadeInDown.duration(600).delay(400)}>
//             <TouchableOpacity 
//               activeOpacity={0.8}
//               onPressIn={handlePressIn} 
//               onPressOut={handlePressOut} 
//               onPress={handleCheckAgain}
//             >
//               <Animated.View style={[styles.primaryBtn, buttonAnimatedStyle]}>
//                 <Text style={styles.primaryText}>Check Again</Text>
//               </Animated.View>
//             </TouchableOpacity>
//           </Animated.View>
//         </View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   content: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     justifyContent: "space-between",
//     paddingBottom: 24,
//   },
//   desktopContent: {
//     maxWidth: 500,
//     alignSelf: "center",
//     width: "100%",
//   },
//   bgCircleTop: {
//     position: "absolute",
//     width: 300,
//     height: 300,
//     borderRadius: 150,
//     backgroundColor: COLORS.saffron + "15",
//     top: -100,
//     right: -100,
//   },
//   bgCircleBottom: {
//     position: "absolute",
//     width: 400,
//     height: 400,
//     borderRadius: 200,
//     backgroundColor: COLORS.saffron + "10",
//     bottom: -150,
//     left: -150,
//   },
//   logoContainer: {
//     alignItems: "center",
//     marginTop: 16,
//     marginBottom: 4,
//   },
//   logo: {
//     width: 130,
//     height: 36,
//   },
//   heroSection: {
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 1,
//   },
//   characterImage: {
//     width: 160,
//     height: 140,
//     marginBottom: 16,
//   },
//   textContainer: {
//     alignItems: "center",
//     paddingHorizontal: 10,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#111",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#444",
//     marginBottom: 6,
//     textAlign: "center",
//   },
//   desc: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     lineHeight: 20,
//     fontWeight: "500",
//   },
//   locationsSection: {
//     marginTop: 16,
//     flexShrink: 0,
//   },
//   locationsTitle: {
//     fontSize: 16,
//     fontWeight: "800",
//     color: "#111",
//     marginBottom: 12,
//     textAlign: "center",
//   },
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   locationCard: {
//     width: "48%",
//     backgroundColor: "#F8FAFC",
//     borderRadius: 16,
//     padding: 12,
//     alignItems: "center",
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#F1F5F9",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   iconContainer: {
//     backgroundColor: "#FFFBEB",
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 8,
//   },
//   locationName: {
//     fontSize: 14,
//     fontWeight: "700",
//     color: "#334155",
//     textAlign: "center",
//     marginBottom: 4,
//   },
//   locationPincode: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#64748B",
//   },
//   actionContainer: {
//     marginTop: 8,
//     flexShrink: 0,
//   },
//   primaryBtn: {
//     backgroundColor: COLORS.saffron,
//     height: 56,
//     borderRadius: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: COLORS.saffron,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   primaryText: {
//     color: "#111",
//     fontWeight: "800",
//     fontSize: 16,
//     letterSpacing: 0.5,
//   },
// });






















import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";

import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../theme/colors";
import NeatifyLogo from "../../assets/images/neatifylogo.png";
import { supabase } from "../lib/supabase";
import LocationService from "../services/LocationService";

export default function ComingSoonScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Animation values
  const buttonScale = useSharedValue(1);
  const characterBob = useSharedValue(0);

  // Available service locations
  const [hubLocations, setHubLocations] = useState<any[]>([]);

  // Loading state
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    // 3D character bobbing animation
    characterBob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );

    // Fetch active service locations
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true);

        const { data, error } = await supabase
          .from("hub_locations")
          .select("id, hub_name, location_name, pincode")
          .eq("is_active", true);

        if (error) {
          console.error(
            "❌ Error fetching service locations:",
            error
          );
          return;
        }

        if (data) {
          const unique = new Map<string, any>();

          for (const row of data) {
            const name = row.location_name || row.hub_name;

            if (!name || !row.pincode) {
              continue;
            }

            const key = `${name}-${row.pincode}`;

            if (!unique.has(key)) {
              unique.set(key, {
                id: row.id,
                name,
                pincode: row.pincode,
              });
            }
          }

          setHubLocations(Array.from(unique.values()));
        }
      } catch (error) {
        console.error(
          "❌ Unexpected error fetching service locations:",
          error
        );
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  // Character animation
  const characterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: characterBob.value }],
    };
  });

  // Button animation
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  // Check current GPS location again
  const handleCheckAgain = () => {
    navigation.replace("LocationAccess");
  };

  /**
   * Customer selects a service area from
   * "Try These Locations".
   *
   * IMPORTANT:
   * This is NOT the customer's actual house address.
   *
   * We only save:
   *   - service area name
   *   - service area pincode
   *
   * The actual house/service address will be collected
   * later during the booking / checkout flow.
   */
  const handleLocationPress = async (hub: any) => {
    try {
      console.log("📍 Selected service area:", hub);

      if (!hub?.name || !hub?.pincode) {
        console.warn(
          "⚠️ Invalid service location selected:",
          hub
        );
        return;
      }

      // Save only the selected service area.
      // NO latitude/longitude is required here.
      await LocationService.setSelectedServiceArea({
        name: hub.name,
        pincode: String(hub.pincode),
        isServiceable: true,
      });

      LocationService.sessionServiceAreaBypass = true;

      console.log("✅ Selected service area saved:", {
        name: hub.name,
        pincode: hub.pincode,
      });

      // Continue to the application.
      // The actual house address will be collected
      // later from the booking/address flow.
      navigation.reset({
        index: 0,
        routes: [{ name: "HomeDrawer" }],
      });
    } catch (error) {
      console.error(
        "❌ Error selecting service area:",
        error
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Decorators */}
      <View
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <View style={styles.bgCircleTop} />
        <View style={styles.bgCircleBottom} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(50)}
          style={styles.logoContainer}
        >
          <Image
            source={NeatifyLogo}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={characterAnimatedStyle}
          >
            <Image
              source={require("../../assets/images/heroimg.png")}
              style={styles.characterImage}
              contentFit="contain"
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.textContainer}
          >
            <Text style={styles.title}>
              We're coming soon! 📍
            </Text>

            <Text style={styles.subtitle}>
              The Neatify Team isn't available in your area yet.
            </Text>

            <Text style={styles.desc}>
              Please try a different location to find available
              services near you.
            </Text>
          </Animated.View>
        </View>

        {/* LOCATIONS SECTION */}
        {hubLocations.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            style={styles.locationsSection}
          >
            <Text style={styles.locationsTitle}>
              Try These Locations
            </Text>

            <View style={styles.grid}>
              {hubLocations.map((hub, idx) => (
                <TouchableOpacity
                  key={`${hub.id || idx}-${hub.pincode}`}
                  style={styles.locationCard}
                  activeOpacity={0.7}
                  onPress={() => handleLocationPress(hub)}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={22}
                      color={COLORS.saffron}
                    />
                  </View>

                  <Text
                    style={styles.locationName}
                    numberOfLines={1}
                  >
                    {hub.name}
                  </Text>

                  <Text style={styles.locationPincode}>
                    {hub.pincode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* NO LOCATIONS */}
        {!loadingLocations &&
          hubLocations.length === 0 && (
            <View style={styles.noLocationsContainer}>
              <Ionicons
                name="location-outline"
                size={28}
                color="#94A3B8"
              />

              <Text style={styles.noLocationsText}>
                No service locations are currently available.
              </Text>
            </View>
          )}

        {/* ACTIONS */}
        <View style={styles.actionContainer}>
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleCheckAgain}
            >
              <Animated.View
                style={[
                  styles.primaryBtn,
                  buttonAnimatedStyle,
                ]}
              >
                <Text style={styles.primaryText}>
                  Check Again
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 24,
  },

  desktopContent: {
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },

  bgCircleTop: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.saffron + "15",
    top: -100,
    right: -100,
  },

  bgCircleBottom: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.saffron + "10",
    bottom: -150,
    left: -150,
  },

  logoContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
  },

  logo: {
    width: 130,
    height: 36,
  },

  heroSection: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },

  characterImage: {
    width: 160,
    height: 140,
    marginBottom: 16,
  },

  textContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
    textAlign: "center",
  },

  desc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },

  locationsSection: {
    marginTop: 16,
    flexShrink: 0,
  },

  locationsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  locationCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  iconContainer: {
    backgroundColor: "#FFFBEB",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  locationName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    marginBottom: 4,
  },

  locationPincode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  noLocationsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  noLocationsText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  actionContainer: {
    marginTop: 8,
    flexShrink: 0,
  },

  primaryBtn: {
    backgroundColor: COLORS.saffron,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.saffron,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  primaryText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});