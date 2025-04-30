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
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Monitor de Temperatura ESP32</h1>
      
      <div className="text-sm mb-4 flex items-center gap-2">
        <div className="flex items-center gap-2">
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
          <span className="text-gray-500">
            • Última atualização: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Temperatura Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : 'Aguardando...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Temperatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={temperatureData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    labelFormatter={(value: number) => new Date(value).toLocaleTimeString()}
                    formatter={(value: number) => [`${value.toFixed(1)}°C`, 'Temperatura']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#8884d8"
                    dot={false}
                    activeDot={{ r: 6, fill: "#8884d8", stroke: "white", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={500}
                    animationEasing="ease-in-out"
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