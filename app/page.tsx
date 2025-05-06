"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TemperatureData {
  temperature: number
  timestamp: number
  type: string
}

interface CustomDotProps {
  cx?: number
  cy?: number
  index?: number
  payload?: TemperatureData
}

export default function Home() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([])
  const [currentTemp, setCurrentTemp] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('Verificando...')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [firstDataReceived, setFirstDataReceived] = useState<boolean>(false)

  // Função para verificar o status do ESP32 com debounce
  const checkESP32Status = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/test')
      const data = await response.json()
      
      if (data.status === 'online') {
        if (!firstDataReceived) {
          setConnectionStatus('Aguardando dados...')
          return
        }
        
        // Verifica se recebemos dados nos últimos 30 segundos
        const timeSinceLastUpdate = lastUpdate 
          ? (new Date().getTime() - lastUpdate.getTime()) 
          : Infinity

        if (timeSinceLastUpdate < 30000) {
          setConnectionStatus('ESP32 Conectado')
        } else {
          setConnectionStatus('Aguardando dados...')
        }
      } else {
        setConnectionStatus('ESP32 Offline')
      }
    } catch (error) {
      setConnectionStatus('Servidor Offline')
    }
  }, [lastUpdate, firstDataReceived])

  // Função para renderizar os pontos do gráfico
  const customDot = useCallback(({ cx, cy, index }: CustomDotProps) => {
    if (typeof index !== 'number' || typeof cx !== 'number' || typeof cy !== 'number') {
      return null
    }

    if (index === temperatureData.length - 1) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="#8884d8"
          stroke="white"
          strokeWidth={2}
        />
      )
    }
    return null
  }, [temperatureData.length])

  useEffect(() => {
    let socket: WebSocket | null = null
    let statusCheckInterval: NodeJS.Timeout
    let reconnectTimeout: NodeJS.Timeout
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 5

    const connect = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        setConnectionStatus('Erro na conexão - Muitas tentativas')
        return
      }

      try {
        socket = new WebSocket('ws://localhost:3001/ws')

        socket.onopen = () => {
          console.log('WebSocket conectado')
          reconnectAttempts = 0
          statusCheckInterval = setInterval(checkESP32Status, 10000)
          checkESP32Status()
        }

        socket.onclose = (event) => {
          setConnectionStatus('Servidor Offline')
          console.log('WebSocket desconectado:', event.code, event.reason)
          if (statusCheckInterval) clearInterval(statusCheckInterval)
          
          // Tenta reconectar após 5 segundos
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++
            connect()
          }, 5000)
        }

        socket.onerror = (event) => {
          setConnectionStatus('Erro na conexão')
          console.error('Erro no WebSocket:', {
            message: event.type,
            error: event
          })
        }

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('Dados recebidos:', data)
            
            if (data.type === 'temperature-update') {
              setCurrentTemp(data.temperature)
              setTemperatureData(prev => {
                if (prev.length === 0) {
                  setFirstDataReceived(true)
                  return [data]
                }
                const newData = [...prev, data]
                return newData.length > 20 
                  ? [newData[0], ...newData.slice(-19)] 
                  : newData
              })
              setLastUpdate(new Date())
              setConnectionStatus('ESP32 Conectado')
            } else if (data.type === 'temperature-history') {
              if (data.data && data.data.length > 0) {
                setFirstDataReceived(true)
                setTemperatureData(data.data)
                setCurrentTemp(data.data[data.data.length - 1].temperature)
                setLastUpdate(new Date(data.data[data.data.length - 1].timestamp))
              }
            }
          } catch (error) {
            console.error('Erro ao processar mensagem:', error)
          }
        }
      } catch (error) {
        console.error('Erro ao criar conexão WebSocket:', error)
        setConnectionStatus('Erro ao criar conexão')
        
        // Tenta reconectar após erro na criação
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++
          connect()
        }, 5000)
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.close()
      }
      if (statusCheckInterval) clearInterval(statusCheckInterval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [checkESP32Status])

  return (
    <main className="container mx-auto py-1 px-2 max-w-5xl min-h-[100vh] h-[100vh] flex flex-col">
      <h1 className="text-lg font-bold mb-1 sm:text-xl">Monitor de Temperatura ESP32</h1>
      
      <div className="text-xs mb-1 flex items-center gap-1">
        <div className="flex items-center gap-1">
          Status: 
          <span className={
            connectionStatus === 'ESP32 Conectado' ? 'text-green-500 font-medium' : 
            connectionStatus === 'Aguardando dados...' ? 'text-yellow-500 font-medium' : 
            'text-red-500 font-medium'
          }>
            {connectionStatus}
          </span>
        </div>
        {lastUpdate && (
          <span className="text-gray-500 text-xs">
            • {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="grid gap-2 md:grid-cols-2 flex-1 pb-1">
        <Card className="shadow-sm flex flex-col overflow-hidden h-full">
          <CardHeader className="py-1 px-3 sm:py-2">
            <CardTitle className="text-sm sm:text-base">Temperatura Atual</CardTitle>
          </CardHeader>
          <CardContent className="py-1 px-3 flex-grow flex items-center justify-center">
            <div className="text-2xl font-bold sm:text-3xl">
              {currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : 'Aguardando...'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col overflow-hidden h-full">
          <CardHeader className="py-1 px-3 sm:py-2">
            <CardTitle className="text-sm sm:text-base">Histórico de Temperatura</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow flex items-center justify-center">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={temperatureData}
                  margin={{ top: 2, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{fontSize: 9}}
                    height={15}
                    scale="time"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{fontSize: 9}}
                    width={20}
                  />
                  <Tooltip 
                    labelFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperatura']}
                    contentStyle={{fontSize: '11px'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#8884d8"
                    dot={false}
                    activeDot={{ r: 3.5, fill: "#8884d8", stroke: "white", strokeWidth: 1 }}
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-in-out"
                    strokeWidth={1.2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}