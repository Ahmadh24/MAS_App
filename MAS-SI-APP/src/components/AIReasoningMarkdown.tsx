import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import Markdown from "react-native-markdown-display"
import { Icon } from "react-native-paper"
import * as Haptics from "expo-haptics"
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withDelay,
  Easing 
} from "react-native-reanimated"

// Thinking/Loading skeleton component
const ThinkingSkeleton = ({ variant = 'dark' }: { variant?: 'light' | 'dark' }) => {
  const shimmer1 = useSharedValue(0)
  const shimmer2 = useSharedValue(0)
  const shimmer3 = useSharedValue(0)
  const pulse = useSharedValue(0.4)

  useEffect(() => {
    // Pulsing animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )

    // Shimmer animations with delays
    shimmer1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )

    shimmer2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    )

    shimmer3.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    )
  }, [])

  const line1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + (shimmer1.value * 0.4),
  }))

  const line2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + (shimmer2.value * 0.4),
  }))

  const line3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + (shimmer3.value * 0.4),
  }))

  const isDark = variant === 'dark'
  const lineColor = isDark ? '#374151' : '#E5E7EB'

  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.header}>
        <View style={[skeletonStyles.aiIcon, { backgroundColor: isDark ? '#3B82F6' : '#60A5FA' }]}>
          <Text style={skeletonStyles.aiIconText}>✦</Text>
        </View>
        <Text style={[skeletonStyles.thinkingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Analyzing content...
        </Text>
      </View>
      <View style={skeletonStyles.linesContainer}>
        <Animated.View style={[skeletonStyles.line, { backgroundColor: lineColor, width: '90%' }, line1Style]} />
        <Animated.View style={[skeletonStyles.line, { backgroundColor: lineColor, width: '75%' }, line2Style]} />
        <Animated.View style={[skeletonStyles.line, { backgroundColor: lineColor, width: '60%' }, line3Style]} />
      </View>
    </View>
  )
}

const skeletonStyles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  aiIconText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  linesContainer: {
    gap: 10,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
})

// Animated generating indicator component
const GeneratingIndicator = ({ variant = 'dark' }: { variant?: 'light' | 'dark' }) => {
  const dot1Opacity = useSharedValue(0.3)
  const dot2Opacity = useSharedValue(0.3)
  const dot3Opacity = useSharedValue(0.3)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    // Pulsing animation for the badge
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )

    // Cascading dot animations
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      true
    )

    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      )
    )

    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        true
      )
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }))

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value
  }))

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value
  }))

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value
  }))

  const isDark = variant === 'dark'

  return (
    <Animated.View style={[styles.generatingBadge, pulseStyle]}>
      <Text style={styles.generatingText}>generating</Text>
      <View style={styles.dotsContainer}>
        <Animated.Text style={[styles.dot, dot1Style, { color: isDark ? '#93C5FD' : '#FFFFFF' }]}>.</Animated.Text>
        <Animated.Text style={[styles.dot, dot2Style, { color: isDark ? '#93C5FD' : '#FFFFFF' }]}>.</Animated.Text>
        <Animated.Text style={[styles.dot, dot3Style, { color: isDark ? '#93C5FD' : '#FFFFFF' }]}>.</Animated.Text>
      </View>
    </Animated.View>
  )
}

// Cache to track already-streamed content
const streamedContentCache = new Set<string>()

type AIReasoningMarkdownProps = {
  content: string | null | undefined
  title?: string
  autoExpand?: boolean
  streamOnMount?: boolean
  streamSpeed?: number
  variant?: 'light' | 'dark'
  maxHeight?: number
}

export function AIReasoningMarkdown({
  content,
  title = "AI Summary",
  autoExpand = true,
  streamOnMount = true,
  streamSpeed = 8,
  variant = 'dark',
  maxHeight = 350,
}: AIReasoningMarkdownProps) {
  // Generate a unique key for this content
  const contentKey = content ? `summary-${content.slice(0, 50)}` : ''
  const alreadyStreamed = contentKey ? streamedContentCache.has(contentKey) : false
  
  const [displayedText, setDisplayedText] = useState(alreadyStreamed ? (content || "") : "")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isExpanded, setIsExpanded] = useState(autoExpand)
  const [hasStreamed, setHasStreamed] = useState(alreadyStreamed)
  const previousContentRef = useRef<string | null | undefined>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  // Auto-scroll to bottom when content updates during streaming
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [])

  const streamText = useCallback(async () => {
    if (!content || hasStreamed) return
    
    // Start with thinking phase
    setIsThinking(true)
    setDisplayedText("")
    
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 2500))
    
    // Transition to streaming phase
    setIsThinking(false)
    setIsStreaming(true)
    
    // Stream character by character
    let scrollCounter = 0
    for (let i = 0; i <= content.length; i++) {
      setDisplayedText(content.slice(0, i))
      // Auto-scroll every 10 characters to keep up with content
      scrollCounter++
      if (scrollCounter >= 10) {
        scrollToBottom()
        scrollCounter = 0
      }
      await new Promise((resolve) => setTimeout(resolve, streamSpeed))
    }
    // Final scroll to ensure we're at the bottom
    scrollToBottom()
    
    setIsStreaming(false)
    setHasStreamed(true)
    // Add to cache so it won't animate again
    if (contentKey) {
      streamedContentCache.add(contentKey)
    }
  }, [content, streamSpeed, hasStreamed, contentKey, scrollToBottom])

  useEffect(() => {
    // Check if content actually changed to something different
    if (previousContentRef.current !== content) {
      previousContentRef.current = content
      
      // Check if this content was already streamed before
      if (contentKey && streamedContentCache.has(contentKey)) {
        // Already seen this content, show immediately - NO animation
        setIsThinking(false)
        setIsStreaming(false)
        setDisplayedText(content || "")
        setHasStreamed(true)
        return
      }
      
      // New content - reset and stream
      if (streamOnMount && content) {
        setHasStreamed(false)
        streamText()
      } else if (!streamOnMount && content) {
        setIsThinking(false)
        setIsStreaming(false)
        setDisplayedText(content)
        setHasStreamed(true)
        if (contentKey) {
          streamedContentCache.add(contentKey)
        }
      }
    }
  }, [content, streamOnMount, streamText, contentKey])

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsExpanded(!isExpanded)
  }

  if (!content || content === "N/A") {
    return (
      <View style={[
        styles.emptyContainer,
        variant === 'dark' ? styles.darkBg : styles.lightBg
      ]}>
        <Icon 
          source="text-box-remove-outline" 
          size={24} 
          color={variant === 'dark' ? '#9CA3AF' : '#6B7280'} 
        />
        <Text style={[
          styles.emptyText,
          variant === 'dark' ? styles.darkEmptyText : styles.lightEmptyText
        ]}>
          No {title.toLowerCase()} available
        </Text>
      </View>
    )
  }

  const isDark = variant === 'dark'

  return (
    <View style={[
      styles.container,
      isDark ? styles.darkContainer : styles.lightContainer
    ]}>
      {/* Header with toggle */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Icon 
            source={(isStreaming || isThinking) ? "loading" : "robot-outline"} 
            size={18} 
            color={isDark ? '#60A5FA' : '#3B82F6'} 
          />
          <Text style={[
            styles.headerTitle,
            isDark ? styles.darkHeaderTitle : styles.lightHeaderTitle
          ]}>
            {title}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {(isStreaming || isThinking) && <GeneratingIndicator variant={variant} />}
          <Icon 
            source={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={[
          styles.contentWrapper,
          isDark ? styles.darkContentWrapper : styles.lightContentWrapper
        ]}>
          {isThinking ? (
            <ThinkingSkeleton variant={variant} />
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              style={{ maxHeight }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.markdownContainer}>
                <Markdown style={isDark ? darkMarkdownStyles : lightMarkdownStyles}>
                  {displayedText || " "}
                </Markdown>
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}

// Keynotes-specific component
// Cache for keynotes
const streamedKeynotesCache = new Set<string>()

type AIKeynotesProps = {
  keynotes: string[] | null | undefined
  title?: string
  autoExpand?: boolean
  streamOnMount?: boolean
  variant?: 'light' | 'dark'
  maxHeight?: number
}

export function AIKeynotes({
  keynotes,
  title = "Key Notes",
  autoExpand = true,
  streamOnMount = true,
  variant = 'dark',
  maxHeight = 350,
}: AIKeynotesProps) {
  // Generate a unique key for these keynotes
  const keynotesKey = keynotes && keynotes.length > 0 
    ? `keynotes-${keynotes.slice(0, 3).join('-').slice(0, 50)}` 
    : ''
  const alreadyStreamed = keynotesKey ? streamedKeynotesCache.has(keynotesKey) : false
  
  const [displayedKeynotes, setDisplayedKeynotes] = useState<string[]>(alreadyStreamed ? (keynotes || []) : [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isExpanded, setIsExpanded] = useState(autoExpand)
  const [hasStreamed, setHasStreamed] = useState(alreadyStreamed)
  const previousKeynotesRef = useRef<string[] | null | undefined>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  // Auto-scroll to bottom when content updates during streaming
  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [])

  const streamKeynotes = useCallback(async () => {
    if (!keynotes || keynotes.length === 0 || hasStreamed) return
    
    // Start with thinking phase
    setIsThinking(true)
    setDisplayedKeynotes([])
    setCurrentIndex(0)
    setCurrentText("")
    
    // Simulate AI thinking time
    await new Promise((resolve) => setTimeout(resolve, 2500))
    
    // Transition to streaming phase
    setIsThinking(false)
    setIsStreaming(true)
    
    for (let i = 0; i < keynotes.length; i++) {
      const keynote = keynotes[i]
      setCurrentIndex(i)
      
      // Stream each keynote character by character
      let scrollCounter = 0
      for (let j = 0; j <= keynote.length; j++) {
        setCurrentText(keynote.slice(0, j))
        // Auto-scroll every 15 characters
        scrollCounter++
        if (scrollCounter >= 15) {
          scrollToBottom()
          scrollCounter = 0
        }
        await new Promise((resolve) => setTimeout(resolve, 8))
      }
      
      // Add completed keynote to displayed list
      setDisplayedKeynotes(prev => [...prev, keynote])
      setCurrentText("")
      
      // Scroll after each keynote completes
      scrollToBottom()
      
      // Small pause between keynotes
      await new Promise((resolve) => setTimeout(resolve, 200))
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    
    // Final scroll to ensure we're at the bottom
    scrollToBottom()
    
    setIsStreaming(false)
    setHasStreamed(true)
    // Add to cache so it won't animate again
    if (keynotesKey) {
      streamedKeynotesCache.add(keynotesKey)
    }
  }, [keynotes, hasStreamed, keynotesKey])

  useEffect(() => {
    // Check if keynotes actually changed
    const keynotesChanged = JSON.stringify(previousKeynotesRef.current) !== JSON.stringify(keynotes)
    
    if (keynotesChanged) {
      previousKeynotesRef.current = keynotes
      
      // Check if these keynotes were already streamed before
      if (keynotesKey && streamedKeynotesCache.has(keynotesKey)) {
        // Already seen these keynotes, show immediately - NO animation
        setIsThinking(false)
        setIsStreaming(false)
        setDisplayedKeynotes(keynotes || [])
        setCurrentText("")
        setHasStreamed(true)
        return
      }
      
      // New keynotes - reset and stream
      if (streamOnMount && keynotes && keynotes.length > 0) {
        setHasStreamed(false)
        setDisplayedKeynotes([])
        setCurrentText("")
        streamKeynotes()
      } else if (!streamOnMount && keynotes) {
        setIsThinking(false)
        setIsStreaming(false)
        setDisplayedKeynotes(keynotes)
        setHasStreamed(true)
        if (keynotesKey) {
          streamedKeynotesCache.add(keynotesKey)
        }
      }
    }
  }, [keynotes, streamOnMount, streamKeynotes, keynotesKey])

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsExpanded(!isExpanded)
  }

  if (!keynotes || keynotes.length === 0) {
    return (
      <View style={[
        styles.emptyContainer,
        variant === 'dark' ? styles.darkBg : styles.lightBg
      ]}>
        <Icon 
          source="format-list-bulleted" 
          size={24} 
          color={variant === 'dark' ? '#9CA3AF' : '#6B7280'} 
        />
        <Text style={[
          styles.emptyText,
          variant === 'dark' ? styles.darkEmptyText : styles.lightEmptyText
        ]}>
          No keynotes available
        </Text>
      </View>
    )
  }

  const isDark = variant === 'dark'

  return (
    <View style={[
      styles.container,
      isDark ? styles.darkContainer : styles.lightContainer
    ]}>
      {/* Header with toggle */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Icon 
            source={(isStreaming || isThinking) ? "loading" : "format-list-bulleted"} 
            size={18} 
            color={isDark ? '#60A5FA' : '#3B82F6'} 
          />
          <Text style={[
            styles.headerTitle,
            isDark ? styles.darkHeaderTitle : styles.lightHeaderTitle
          ]}>
            {title}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {(isStreaming || isThinking) && <GeneratingIndicator variant={variant} />}
          <Icon 
            source={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
        </View>
      </TouchableOpacity>

      {/* Content */}
      {isExpanded && (
        <View style={[
          styles.contentWrapper,
          isDark ? styles.darkContentWrapper : styles.lightContentWrapper
        ]}>
          {isThinking ? (
            <ThinkingSkeleton variant={variant} />
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              style={{ maxHeight }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            <View style={styles.keynotesContainer}>
              {displayedKeynotes.map((keynote, index) => (
                <View key={index} style={styles.keynoteItem}>
                  <View style={[
                    styles.keynoteBullet,
                    isDark ? styles.darkBullet : styles.lightBullet
                  ]}>
                    <Text style={styles.bulletNumber}>{index + 1}</Text>
                  </View>
                  <Text style={[
                    styles.keynoteText,
                    isDark ? styles.darkKeynoteText : styles.lightKeynoteText
                  ]}>
                    {keynote}
                  </Text>
                </View>
              ))}
              
              {/* Currently streaming keynote */}
              {isStreaming && currentText && (
                <View style={styles.keynoteItem}>
                  <View style={[
                    styles.keynoteBullet,
                    styles.streamingBullet
                  ]}>
                    <Text style={styles.bulletNumber}>{currentIndex + 1}</Text>
                  </View>
                  <Text style={[
                    styles.keynoteText,
                    isDark ? styles.darkKeynoteText : styles.lightKeynoteText
                  ]}>
                    {currentText}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  darkContainer: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  darkHeaderTitle: {
    color: '#E5E7EB',
  },
  lightHeaderTitle: {
    color: '#1F2937',
  },
  generatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  generatingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 1,
  },
  dot: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  contentWrapper: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  darkContentWrapper: {
    borderTopColor: '#2D3748',
  },
  lightContentWrapper: {
    borderTopColor: '#E2E8F0',
  },
  markdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginVertical: 8,
  },
  darkBg: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  lightBg: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
  },
  darkEmptyText: {
    color: '#9CA3AF',
  },
  lightEmptyText: {
    color: '#6B7280',
  },
  keynotesContainer: {
    gap: 12,
  },
  keynoteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  keynoteBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBullet: {
    backgroundColor: '#374151',
  },
  lightBullet: {
    backgroundColor: '#E5E7EB',
  },
  streamingBullet: {
    backgroundColor: '#3B82F6',
  },
  bulletNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  keynoteText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  darkKeynoteText: {
    color: '#D1D5DB',
  },
  lightKeynoteText: {
    color: '#374151',
  },
})

const darkMarkdownStyles = StyleSheet.create({
  body: {
    color: '#D1D5DB',
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    color: '#F3F4F6',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#F3F4F6',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  strong: {
    color: '#F9FAFB',
    fontWeight: 'bold',
  },
  em: {
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#374151',
    color: '#60A5FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  code_block: {
    backgroundColor: '#374151',
    color: '#D1D5DB',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#374151',
    color: '#D1D5DB',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: '#1F2937',
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  list_item: {
    color: '#D1D5DB',
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  link: {
    color: '#60A5FA',
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: '#374151',
    height: 1,
    marginVertical: 16,
  },
})

const lightMarkdownStyles = StyleSheet.create({
  body: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  strong: {
    color: '#111827',
    fontWeight: 'bold',
  },
  em: {
    color: '#4B5563',
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F1F5F9',
    color: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  code_block: {
    backgroundColor: '#F1F5F9',
    color: '#374151',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#F1F5F9',
    color: '#374151',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 8,
  },
  blockquote: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  list_item: {
    color: '#374151',
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  ordered_list: {
    marginVertical: 8,
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: '#E5E7EB',
    height: 1,
    marginVertical: 16,
  },
})

export default AIReasoningMarkdown

