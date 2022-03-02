import React, { useState, useEffect } from 'react';
import getSymbolFromCurrency from 'currency-symbol-map'

export default function CheckoutUPE(props) {
    const [clientSecret, setClientSecret] = useState('');
    const [paymentElement, setPaymentElement] = useState();
    const [stripe, setStripe] = useState();
    const [error, setError] = useState('');

    const styles = {
        button: {
            color: 'white',
            backgroundColor: props.brandColor,
            border: 0
        },
        checkout: {
            border: '1px solid silver',
            borderRadius: 4,
            padding: 20,
            boxShadow: 'silver 0px 0px 6px 0px'
        },
        error: {
            color: 'tomato',
            marginTop: 20
        }
    }

    let total = props.cart.totalPrice.centAmount;
    total = `${getSymbolFromCurrency(props.currency)} ${(total / 100).toFixed(2)}`
    

    const appearance = {
        rowGap: '10px',
        columnGap: '20px',
        rules: {
            '*': {
                fontFamily: 'Roboto, sans-serif',
                fontSize: '16px',
                color: '#425466'
            },
            '.Label': {
                fontWeight: '500'
            },
            '.Input--invalid': {
                color: 'tomato'
            },
            '.Input:disabled, .Input--invalid:disabled': {
                color: 'lightgray',
            },
            '.Tab': {
                borderRadius: '4px'
            },
            '.Input': {
                borderRadius: '4px'
            },
            '.Error': {
                color: 'tomato'
            }
        }
    }

    // Create the PI when the customer ID is obtained
    useEffect(() => {
        fetch("/create-payment-intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cart: props.cart,
                customer: props.custId,
                currency: props.currency
            })
        })
            .then(res => res.json())
            .then(data => {
                setClientSecret(data.clientSecret);
            });
    }, [props.custId]);

    useEffect(() => {
        if (clientSecret !== '') {
            const stripe = window.Stripe(process.env.REACT_APP_PK, {
                betas: ['payment_element_beta_1']
            });
            const elements = stripe.elements({
                fonts: [
                    { cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }
                ]
            });
            const paymentElement = elements.create("payment", { clientSecret, appearance });
            paymentElement.mount("#payment-element");
            setStripe(stripe);
            setPaymentElement(paymentElement);
        }
    }, [clientSecret]);


    const submitPayment = async (e) => {
        e.preventDefault();

        // Code below to add the billing and shipping address info is a temporary fix for an issue with Afterpay
        const { error } = await stripe.confirmPayment({
            element: paymentElement,
            confirmParams: {
                return_url: process.env.REACT_APP_BASE_URL + '/confirm',
                payment_method_data: {
                    billing_details: {
                        name: props.custInfo.name,
                        email: props.custInfo.email,
                        address: {
                            city: props.custInfo.city,
                            country: "US",
                            line1: props.custInfo.address,
                            line2: null,
                            postal_code: props.custInfo.zip,
                            state: props.custInfo.state,
                        }
                    },

                },
                shipping: {
                    name: props.custInfo.name,
                    address: {
                        city: props.custInfo.city,
                        country: "US",
                        line1: props.custInfo.address,
                        line2: null,
                        postal_code: props.custInfo.zip,
                        state: props.custInfo.state,
                    }
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setError('');

        }
    }

    return (
        <form id="payment-form" style={styles.checkout}>
            <div id="payment-element"></div>
            <div style={styles.error}>{error}</div>
            <button className="form-control btn btn-primary" onClick={submitPayment} style={styles.button}>Pay {total} now</button>
        </form>
    )

}