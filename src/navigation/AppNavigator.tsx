import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../hooks/useAppDirection';

import DashboardScreen from '../screens/main/DashboardScreen';
import StudentsScreen from '../screens/main/StudentsScreen';
import AttendanceScreen from '../screens/main/AttendanceScreen';
import TasksScreen from '../screens/main/TasksScreen';

import ScheduleScreen from '../screens/main/ScheduleScreen';
import MessagesScreen from '../screens/main/MessagesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import FinanceScreen from '../screens/main/FinanceScreen';
import BehaviorScreen from '../screens/main/BehaviorScreen';
import SummonsScreen from '../screens/main/SummonsScreen';
import CommitteesScreen from '../screens/main/CommitteesScreen';
import HomeworkScreen from '../screens/main/HomeworkScreen';
import HRScreen from '../screens/main/HRScreen';
import PortfolioScreen from '../screens/main/PortfolioScreen';
import ExamDistributionScreen from '../screens/main/ExamDistributionScreen';
import AtRiskScreen from '../screens/main/AtRiskScreen';
import NoorIntegrationScreen from '../screens/main/NoorIntegrationScreen';
import IntegrationsScreen from '../screens/main/IntegrationsScreen';
import WhatsAppScreen from '../screens/main/WhatsAppScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

import MoreMenuModal from '../components/navigation/MoreMenuModal';
import PermissionGuard from '../components/auth/PermissionGuard';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/uiStore';
import { colors } from '../theme/colors';
import { ibmPlexArabicFontFamily } from '../theme/typography';

import NavigationIcon from '../components/common/NavigationIcon';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface TabIconProps {
  name: 'home' | 'students' | 'attendance' | 'tasks' | 'more';
  focused: boolean;
  color: string;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, color }) => {
  const getIconName = (): 'home' | 'users' | 'clipboard' | 'activity' | 'menu' => {
    switch (name) {
      case 'home':
        return 'home';
      case 'students':
        return 'users';
      case 'attendance':
        return 'clipboard';
      case 'tasks':
        return 'activity';
      case 'more':
        return 'menu';
      default:
        return 'home';
    }
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <NavigationIcon
        name={getIconName()}
        focused={focused}
        size={20}
        activeColor={color}
        inactiveColor="#77839B"
      />
    </View>
  );
};

interface MainTabsProps {
  onOpenMoreMenu: () => void;
  activeSecondaryRoute?: string;
}

function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
  onOpenMoreMenu,
  activeSecondaryRoute,
}: BottomTabBarProps & { onOpenMoreMenu: () => void; activeSecondaryRoute?: string }) {
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const role = (useAuthStore((s) => s.role) || '').toLowerCase();
  const isPortalUser =
    role.includes('student') ||
    role.includes('parent') ||
    ['طالب', 'طالبة', 'ولي أمر', 'ولي_أمر'].includes(role);

  if (isPortalUser) return null;

  return (
    <View
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        borderTopColor: isDark ? '#1E293B' : '#E1E7F0',
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#0A1D3D',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isMore = route.name === 'MoreTab';
        const isFocused = state.index === index || (isMore && !!activeSecondaryRoute);
        const color = isFocused ? (colors.blue || '#1246B7') : (colors.tx2 || '#77839B');
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          if (isMore) {
            onOpenMoreMenu();
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={(options as any).tabBarTestID || (options as any).tabBarButtonTestID}
            onPress={onPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {options.tabBarIcon ? options.tabBarIcon({ focused: isFocused, color, size: 24 }) : null}
            <Text
              style={{
                color,
                fontSize: 10,
                fontWeight: '600',
                marginTop: 2,
                textAlign: 'center',
              }}
            >
              {typeof label === 'string' ? label : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabNavigator({ onOpenMoreMenu, activeSecondaryRoute }: MainTabsProps) {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => (
        <CustomBottomTabBar
          {...props}
          onOpenMoreMenu={onOpenMoreMenu}
          activeSecondaryRoute={activeSecondaryRoute}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('navigation.home', 'الرئيسية'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{
          tabBarLabel: t('navigation.students', 'الطلاب'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="students" focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: t('navigation.attendance', 'الحضور'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="attendance" focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarLabel: t('navigation.tasks', 'المهام'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="tasks" focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="MoreTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('navigation.more', 'المزيد'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="more" focused={focused || !!activeSecondaryRoute} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            onOpenMoreMenu();
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [activeSecondaryRoute, setActiveSecondaryRoute] = useState<string | undefined>();
  const navigationRef = React.useRef<any>(null);

  const handleSelectModule = (routeName: string) => {
    setActiveSecondaryRoute(routeName);
    setMoreMenuVisible(false);
    if (navigationRef.current) {
      navigationRef.current.navigate(routeName);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        screenListeners={{
          state: (e: any) => {
            const routes = e.data?.state?.routes;
            if (routes && routes.length > 0) {
              const currentRouteName = routes[routes.length - 1].name;
              if (currentRouteName !== 'MainTabs') {
                setActiveSecondaryRoute(currentRouteName);
              } else {
                setActiveSecondaryRoute(undefined);
              }
            }
          },
        }}
      >
        <Stack.Screen name="MainTabs">
          {(props) => {
            navigationRef.current = props.navigation;
            return (
              <MainTabNavigator
                onOpenMoreMenu={() => setMoreMenuVisible(true)}
                activeSecondaryRoute={activeSecondaryRoute}
              />
            );
          }}
        </Stack.Screen>

        {/* Registered Protected Secondary Stack Screens */}
        <Stack.Screen name="Schedule">
          {() => <PermissionGuard permission="schedule.view"><ScheduleScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Messages">
          {() => <PermissionGuard permission="messages.view"><MessagesScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Reports">
          {() => <PermissionGuard permission="reports.view"><ReportsScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Finance">
          {() => <PermissionGuard permission="finance.reports.view"><FinanceScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Behavior">
          {() => <PermissionGuard permission="behavior.view"><BehaviorScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Summons">
          {() => <PermissionGuard permission="summons.view"><SummonsScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Committees">
          {() => <PermissionGuard permission="committees.view"><CommitteesScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Homework">
          {() => <PermissionGuard permission="homework.assignment.view"><HomeworkScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="HR">
          {() => <PermissionGuard permission="hr.employee.profile.view"><HRScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Portfolio">
          {() => <PermissionGuard permission="portfolio.view"><PortfolioScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="ExamDistribution">
          {() => <PermissionGuard permission="exams.view"><ExamDistributionScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="AtRisk">
          {() => <PermissionGuard permission="at_risk.view"><AtRiskScreen /></PermissionGuard>}
        </Stack.Screen>
        <Stack.Screen name="Noor">
          {() => <PermissionGuard permission="settings.manage"><NoorIntegrationScreen /></PermissionGuard>}
        </Stack.Screen>
        {/* Official API: no specific permission required for Integrations */}
        <Stack.Screen name="Integrations" component={IntegrationsScreen} />
        <Stack.Screen name="WhatsApp">
          {() => <PermissionGuard permission="messages.send"><WhatsAppScreen /></PermissionGuard>}
        </Stack.Screen>
      </Stack.Navigator>

      {/* More Menu Drawer / Modal */}
      <MoreMenuModal
        visible={moreMenuVisible}
        onClose={() => setMoreMenuVisible(false)}
        onSelectModule={handleSelectModule}
        currentRoute={activeSecondaryRoute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconContainerFocused: {
    backgroundColor: '#EEF4FF',
  },
  iconText: {
    fontSize: 18,
  },
});
