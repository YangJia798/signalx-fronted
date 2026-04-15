import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import { constants } from '@/stores/constants'

import ErrorView from '@/views/ErrorView'
import LayoutRootStarlight from '@/components/Layout/RootStarlight'

// 首屏直接加载（首页本身）
import Home from '@/views/Home/index'

// 其他路由懒加载，各自独立 chunk
const CopyTrading  = lazy(() => import('@/views/CopyTrading'))
const Rewards      = lazy(() => import('@/views/Rewards'))
const Leaderboard  = lazy(() => import('@/views/Leaderboard/index'))
const TrackMonitor = lazy(() => import('@/views/TrackMonitor'))
const Discover     = lazy(() => import('@/views/Discover/index'))
const TraderDetails = lazy(() => import('@/views/TraderDetails'))
const Trade        = lazy(() => import('@/views/Trade'))

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={null}>{children}</Suspense>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutRootStarlight />,
    errorElement: <ErrorView />,
    children: [
      {
        path: '',
        index: true,
        element: <Home />
      },
    ]
  },
  {
    path: '/',
    element: <LayoutRootStarlight />,
    errorElement: <ErrorView />,
    children: [
      {
        path: 'copy-trading',
        index: true,
        element: <LazyPage><CopyTrading /></LazyPage>
      },
      {
        path: 'rewards',
        index: true,
        element: <LazyPage><Rewards /></LazyPage>
      },
      {
        path: 'whales',
        index: true,
        element: <LazyPage><Leaderboard /></LazyPage>
      },
      {
        path: 'track-monitor',
        index: true,
        element: <LazyPage><TrackMonitor /></LazyPage>
      },
      {
        path: 'discover',
        index: true,
        element: <LazyPage><Discover /></LazyPage>
      },
      {
        path: 'trader/:address',
        index: true,
        element: <LazyPage><TraderDetails /></LazyPage>
      }
    ]
  },
  {
    path: '/',
    element: <LayoutRootStarlight full footer={null} />,
    errorElement: <ErrorView />,
    children: [
      {
        path: 'trade/:coin?',
        index: true,
        element: <LazyPage><Trade /></LazyPage>
      }
    ]
  }
], {
  basename: constants.app.PUBLIC_PATH_BASE
})

export default router