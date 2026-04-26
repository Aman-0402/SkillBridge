import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Payment() {
  const { proposalId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('mock')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  useEffect(() => {
    fetchProposalAndPayment()
  }, [proposalId])

  const fetchProposalAndPayment = async () => {
    try {
      // Fetch proposal
      const propResponse = await api.get(`/projects/proposals/${proposalId}/`)
      setProposal(propResponse.data)

      // Check if payment exists
      try {
        const paymentResponse = await api.get(`/proposals/payments/?proposal_id=${proposalId}`)
        if (Array.isArray(paymentResponse.data) && paymentResponse.data.length > 0) {
          setPayment(paymentResponse.data[0])
        }
      } catch (e) {
        // Payment doesn't exist yet
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async () => {
    try {
      setProcessing(true)
      const response = await api.post('/proposals/payments/', {
        proposal: proposalId,
        amount: proposal.bid_amount,
        payment_method: paymentMethod,
      })
      setPayment(response.data)
    } catch (error) {
      console.error('Failed to create payment:', error)
      alert('Failed to create payment')
    } finally {
      setProcessing(false)
    }
  }

  const handleProcessPayment = async () => {
    if (paymentMethod !== 'mock') {
      // Validate card details
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
        alert('Please fill in all card details')
        return
      }
    }

    try {
      setProcessing(true)
      const response = await api.post(`/proposals/payments/${payment.id}/process_payment/`)

      if (response.data.status === 'completed') {
        alert('✅ Payment successful!')
        setPayment({ ...payment, status: 'completed' })
        setTimeout(() => navigate('/projects'), 2000)
      } else {
        alert('❌ Payment failed. Please try again.')
        setPayment({ ...payment, status: 'failed' })
      }
    } catch (error) {
      console.error('Failed to process payment:', error)
      alert('Payment processing error')
    } finally {
      setProcessing(false)
    }
  }

  const handleCardChange = (e) => {
    const { name, value } = e.target
    setCardDetails(prev => ({ ...prev, [name]: value }))
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  if (!proposal) return <div className="flex justify-center items-center h-screen">Proposal not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/projects" className="text-indigo-600 hover:text-indigo-700 font-bold">← Back</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Project</p>
                <p className="font-semibold text-gray-900">{proposal.project.title}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Freelancer</p>
                <p className="font-semibold text-gray-900">{proposal.freelancer.username}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Bid Amount</p>
                  <p className="font-semibold text-gray-900">${proposal.bid_amount}</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-gray-900">Total</p>
                  <p className="text-2xl font-bold text-indigo-600">${proposal.bid_amount}</p>
                </div>
              </div>
            </div>

            {payment && (
              <div className={`p-4 rounded-lg ${
                payment.status === 'completed' ? 'bg-green-50 border border-green-200' :
                payment.status === 'failed' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <p className="text-sm font-semibold">
                  Transaction ID: {payment.transaction_id}
                </p>
                <p className="text-sm capitalize">
                  Status: <span className="font-bold">{payment.status}</span>
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

            {!payment ? (
              <button
                onClick={handleCreatePayment}
                disabled={processing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {processing ? 'Creating Payment...' : 'Create Payment'}
              </button>
            ) : payment.status === 'completed' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Your payment has been processed successfully.</p>
              </div>
            ) : payment.status === 'failed' ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h3>
                <p className="text-gray-600 mb-4">Your payment could not be processed.</p>
                <button
                  onClick={() => setPayment(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="mock"
                        checked={paymentMethod === 'mock'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">
                        💳 Mock Payment (Demo - Simulated)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Credit Card</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="debit_card"
                        checked={paymentMethod === 'debit_card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Debit Card</span>
                    </label>
                  </div>
                </div>

                {paymentMethod !== 'mock' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        name="cardholderName"
                        value={cardDetails.cardholderName}
                        onChange={handleCardChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        maxLength="16"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={cardDetails.expiryDate}
                          onChange={handleCardChange}
                          maxLength="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          maxLength="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={handleProcessPayment}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Pay $${proposal.bid_amount}`}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  🔒 All transactions are secure and encrypted
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
