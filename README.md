# Arweave.Identicons
Create your own identicon and upload it to Arweave. Use it across other permaweb apps as a way to identify yourself, better used along ArweaveID.

Similarly to ArweaveID, you can get all your identicons by running an ArQL query:

```

{
    op: 'and',
    expr1:
        {
            op: 'equals',
            expr1: 'App-Name',
            expr2: 'arweave-identicons'
        },
    expr2:
        {
            op: 'equals',
            expr1: 'from',
            expr2: [address],
        },
  }
```

**Note: images are being saved in Base64 encoding format. Browsers can display these images without any problems.**
