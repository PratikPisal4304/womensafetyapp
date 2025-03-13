// JobMarketInsightsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { db, auth } from '../../config/firebaseConfig';
import { useTranslation } from 'react-i18next';

const PINK = '#ff5f96';
const WIDTH = Dimensions.get('window').width;

const JobMarketInsightsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('safety');
  const [locationFilter, setLocationFilter] = useState('All');
  const [jobData, setJobData] = useState({
    totalJobs: 0,
    safetyJobs: 0,
    openPositions: [],
    trending: [],
    salaryData: {},
    skillDemand: {},
    locations: []
  });

  // Fetch job market data from Firestore
  const fetchJobData = async () => {
    try {
      setLoading(true);
      
      // This would be a real Firestore query in production
      // For demo purposes, creating realistic mock data related to safety/security
      
      // Simulate fetching job statistics
      const statData = {
        totalJobs: 1856,
        safetyJobs: 782,
        locations: ['All', 'New York', 'San Francisco', 'Chicago', 'Austin', 'Remote']
      };
      
      // Simulate fetching trending job roles in safety/security
      const trendingRoles = [
        { id: 1, title: 'Cybersecurity Analyst', growth: '+18%', category: 'safety' },
        { id: 2, title: 'Safety Compliance Manager', growth: '+15%', category: 'safety' },
        { id: 3, title: 'Women\'s Safety Advocate', growth: '+22%', category: 'safety' },
        { id: 4, title: 'Emergency Response Coordinator', growth: '+12%', category: 'safety' },
        { id: 5, title: 'Software Engineer', growth: '+14%', category: 'tech' },
        { id: 6, title: 'UX Designer', growth: '+10%', category: 'tech' }
      ];
      
      // Simulate fetching salary data
      const salaryTrends = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            data: [72000, 74500, 76000, 78000, 80500, 82000],
            color: () => PINK,
            strokeWidth: 2
          }
        ]
      };
      
      // Simulate fetching skill demand data
      const skillData = {
        labels: ['Risk Assessment', 'Crisis Management', 'Self-Defense', 'Compliance', 'First Aid'],
        datasets: [
          {
            data: [85, 75, 60, 82, 70],
            colors: [
              (opacity = 1) => `rgba(255, 95, 150, ${opacity})`,
              (opacity = 1) => `rgba(245, 85, 140, ${opacity})`,
              (opacity = 1) => `rgba(235, 75, 130, ${opacity})`,
              (opacity = 1) => `rgba(225, 65, 120, ${opacity})`,
              (opacity = 1) => `rgba(215, 55, 110, ${opacity})`
            ]
          }
        ]
      };
      
      // Simulate fetching open positions
      const positions = [
        {
          id: 'job1',
          title: 'Personal Safety Consultant',
          company: 'SecureHer Inc.',
          location: 'New York',
          salary: '$75,000 - $95,000',
          posted: '2 days ago',
          category: 'safety',
          description: 'Design and implement personal safety programs for individuals and organizations.',
          skills: ['Risk Assessment', 'Self-Defense Training', 'Crisis Management'],
          logo: require('../../assets/company1.png')
        },
        {
          id: 'job2',
          title: 'Women\'s Safety Program Director',
          company: 'SafeSpace Foundation',
          location: 'San Francisco',
          salary: '$90,000 - $110,000',
          posted: '1 week ago',
          category: 'safety',
          description: 'Lead initiatives to improve women\'s safety in urban environments.',
          skills: ['Program Management', 'Community Outreach', 'Policy Development'],
          logo: require('../../assets/company2.png')
        },
        {
          id: 'job3',
          title: 'Safety App Developer',
          company: 'GuardTech Solutions',
          location: 'Remote',
          salary: '$105,000 - $125,000',
          posted: '3 days ago',
          category: 'safety',
          description: 'Build mobile applications focused on personal safety and emergency response.',
          skills: ['React Native', 'Firebase', 'Geolocation APIs'],
          logo: require('../../assets/company3.png')
        },
        {
          id: 'job4',
          title: 'UX Designer',
          company: 'TechCorp',
          location: 'Austin',
          salary: '$85,000 - $105,000',
          posted: '5 days ago',
          category: 'tech',
          description: 'Design user interfaces for web and mobile applications.',
          skills: ['UI/UX', 'Figma', 'User Research'],
          logo: require('../../assets/icon.png')
        }
      ];
      
      setJobData({
        totalJobs: statData.totalJobs,
        safetyJobs: statData.safetyJobs,
        openPositions: positions,
        trending: trendingRoles,
        salaryData: salaryTrends,
        skillDemand: skillData,
        locations: statData.locations
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobData();
    setRefreshing(false);
  };

  // Filter jobs based on selected category
  const filteredJobs = jobData.openPositions.filter(job => {
    if (selectedFilter === 'all') return true;
    if (locationFilter !== 'All' && job.location !== locationFilter) return false;
    return job.category === selectedFilter;
  });

  // Filter trending roles based on selected category
  const filteredTrending = jobData.trending.filter(job => {
    if (selectedFilter === 'all') return true;
    return job.category === selectedFilter;
  });

  const renderJobItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobDetails', { job: item })}
    >
      <View style={styles.jobCardHeader}>
        <Image 
          source={item.logo || require('../../assets/icon.png')} 
          style={styles.companyLogo} 
        />
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.companyName}>{item.company}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.jobCardBody}>
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.skillsContainer}>
          {item.skills.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.jobCardFooter}>
        <Text style={styles.salaryText}>{item.salary}</Text>
        <View style={styles.postedContainer}>
          <MaterialIcons name="access-time" size={14} color="#666" />
          <Text style={styles.postedText}>{item.posted}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>{t('jobs.apply') || 'Apply Now'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('jobs.marketInsights') || 'Job Market Insights'}</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="options-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PINK]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={PINK} style={styles.loader} />
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{jobData.totalJobs.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{t('jobs.totalJobs') || 'Total Jobs'}</Text>
              </View>
              <View style={[styles.statCard, styles.highlightStatCard]}>
                <Text style={styles.highlightStatValue}>{jobData.safetyJobs.toLocaleString()}</Text>
                <Text style={styles.highlightStatLabel}>{t('jobs.safetyJobs') || 'Safety & Security'}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round((jobData.safetyJobs/jobData.totalJobs)*100)}%</Text>
                <Text style={styles.statLabel}>{t('jobs.growth') || 'Growth'}</Text>
              </View>
            </View>
            
            {/* Category Filters */}
            <View style={styles.filterContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.categories') || 'Categories'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'all' && styles.activeFilterButton]}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
                    {t('jobs.allJobs') || 'All Jobs'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'safety' && styles.activeFilterButton]}
                  onPress={() => setSelectedFilter('safety')}
                >
                  <Text style={[styles.filterText, selectedFilter === 'safety' && styles.activeFilterText]}>
                    {t('jobs.safetyJobs') || 'Safety & Security'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'tech' && styles.activeFilterButton]}
                  onPress={() => setSelectedFilter('tech')}
                >
                  <Text style={[styles.filterText, selectedFilter === 'tech' && styles.activeFilterText]}>
                    {t('jobs.techJobs') || 'Technology'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Location Filters */}
            <View style={styles.locationFilterContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.location') || 'Location'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {jobData.locations.map((location, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={[styles.locationFilterChip, locationFilter === location && styles.activeLocationChip]}
                    onPress={() => setLocationFilter(location)}
                  >
                    <Text style={[styles.locationFilterText, locationFilter === location && styles.activeLocationText]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Salary Trends */}
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.salaryTrends') || 'Salary Trends'}</Text>
              <Text style={styles.subtitle}>
                {selectedFilter === 'safety' 
                  ? t('jobs.safetySalaryTrend') || 'Average salary for safety & security roles'
                  : t('jobs.allSalaryTrend') || 'Average salary across all industries'}
              </Text>
              <LineChart
                data={jobData.salaryData}
                width={WIDTH - 40}
                height={180}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 95, 150, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: PINK,
                  },
                  propsForLabels: {
                    fontSize: 12,
                  },
                }}
                bezier
                style={styles.chart}
                formatYLabel={(value) => `$${parseInt(value/1000)}k`}
              />
            </View>
            
            {/* Trending Roles */}
            <View style={styles.trendingContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.trendingRoles') || 'Trending Roles'}</Text>
              <Text style={styles.subtitle}>
                {selectedFilter === 'safety' 
                  ? t('jobs.trendingSafetyRoles') || 'Fastest growing roles in safety & security'
                  : t('jobs.trendingAllRoles') || 'Fastest growing roles across industries'}
              </Text>
              
              {filteredTrending.map((role, index) => (
                <View key={role.id} style={styles.trendingItem}>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingRank}>{index + 1}</Text>
                    <Text style={styles.trendingTitle}>{role.title}</Text>
                  </View>
                  <Text style={styles.trendingGrowth}>{role.growth}</Text>
                </View>
              ))}
            </View>
            
            {/* In-Demand Skills */}
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.skillDemand') || 'In-Demand Skills'}</Text>
              <Text style={styles.subtitle}>
                {selectedFilter === 'safety' 
                  ? t('jobs.safetySkills') || 'Top skills requested for safety & security roles'
                  : t('jobs.allSkills') || 'Top skills across industries'}
              </Text>
              <BarChart
                data={jobData.skillDemand}
                width={WIDTH - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 95, 150, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                fromZero={true}
                withInnerLines={false}
              />
            </View>
            
            {/* Open Positions */}
            <View style={styles.openPositionsContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('jobs.openPositions') || 'Open Positions'}</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.viewAllText}>{t('jobs.viewAll') || 'View All'}</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.subtitle}>
                {filteredJobs.length > 0 
                  ? `${filteredJobs.length} ${t('jobs.positionsFound') || 'positions found'}`
                  : t('jobs.noPositions') || 'No positions found for selected filters'}
              </Text>
              
              <FlatList
                data={filteredJobs}
                renderItem={renderJobItem}
                keyExtractor={item => item.id}
                horizontal={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <FontAwesome5 name="briefcase" size={40} color="#DDD" />
                    <Text style={styles.emptyStateText}>
                      {t('jobs.noJobs') || 'No jobs found for current filters'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.resetFiltersButton}
                      onPress={() => {
                        setSelectedFilter('all');
                        setLocationFilter('All');
                      }}
                    >
                      <Text style={styles.resetFiltersText}>
                        {t('jobs.resetFilters') || 'Reset Filters'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
            
            {/* Career Resources Section */}
            <View style={styles.resourcesContainer}>
              <Text style={styles.sectionTitle}>{t('jobs.careerResources') || 'Safety Career Resources'}</Text>
              <View style={styles.resourceCard}>
                <Image 
                  source={require('../../assets/skill.png')} 
                  style={styles.resourceIcon} 
                />
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceTitle}>
                    {t('jobs.safetyTraining') || 'Safety Training Certification'}
                  </Text>
                  <Text style={styles.resourceDescription}>
                    {t('jobs.trainingDesc') || 'Get certified in essential safety skills to boost your career.'}
                  </Text>
                  <TouchableOpacity style={styles.resourceButton}>
                    <Text style={styles.resourceButtonText}>
                      {t('jobs.learnMore') || 'Learn More'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.careerAdviceButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
                <Text style={styles.careerAdviceText}>
                  {t('jobs.careerAdvice') || 'Get Personalized Career Advice'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobMarketInsightsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loader: {
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  highlightStatCard: {
    backgroundColor: PINK + '15',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  highlightStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PINK,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  highlightStatLabel: {
    fontSize: 12,
    color: PINK,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  locationFilterContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: PINK,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilterText: {
    color: '#FFF',
    fontWeight: '500',
  },
  locationFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 8,
  },
  activeLocationChip: {
    backgroundColor: PINK + '20',
    borderWidth: 1,
    borderColor: PINK,
  },
  locationFilterText: {
    fontSize: 13,
    color: '#333',
  },
  activeLocationText: {
    color: PINK,
    fontWeight: '500',
  },
  chartContainer: {
    marginTop: 25,
    padding: 20,
  },
  chart: {
    marginTop: 10,
    borderRadius: 12,
  },
  trendingContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingRank: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: PINK,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 25,
    fontWeight: 'bold',
    marginRight: 10,
  },
  trendingTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  trendingGrowth: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  openPositionsContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    color: PINK,
    fontSize: 14,
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginVertical: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: PINK,
  },
  jobCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  jobCardBody: {
    marginBottom: 12,
  },
  jobDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: PINK + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: PINK,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  salaryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  postedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postedText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  applyButton: {
    backgroundColor: PINK,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  resetFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PINK + '15',
    borderRadius: 20,
  },
  resetFiltersText: {
    color: PINK,
    fontWeight: '500',
  },
  resourcesContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  resourceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  resourceIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  resourceButton: {
    backgroundColor: PINK,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  resourceButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  careerAdviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PINK,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  careerAdviceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
