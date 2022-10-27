import express, { Express, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch'
import { parse } from "csv-parse/sync";

const app: Express = express();
const port = 2000;


const downloadCSV = async (url: string) => {
    try {
        const res = await fetch(url, { method: 'Get' });
        return await res.text();
    } catch (err) {
        return "error";
    }
}

app.use(express.static('data'))


app.get('/evaluation', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.query.url as string
    let csvData: any[] = []

    const parseData = async (url: string) => {
        let data = await downloadCSV(url)
        try {
            const csv = parse(data,{
                columns: true,
                skip_empty_lines: true
            })
            csvData.push(...csv)

        } catch (error) {
            next(error)
        }
    }

    if (Array.isArray(url)) {
        for (let i of url) {
            await parseData(i)
        }
    }

    if (typeof url === "string") {
        await parseData(url)
    }

    let mostSpeeches: { [id: string]: number } = {};
    let internalSecurity: { [id: string]: number } = {};
    let fewestWords: { [id: string]: number } = {};

    for (let i of csvData) {
        if (i.Date.includes("2013")) {
            if (!mostSpeeches[i.Speaker]) {
                mostSpeeches[i.Speaker] = 0;
            }
            mostSpeeches[i.Speaker] ++;
        }

        if (i.Topic === "Internal Security") {
            if (!internalSecurity[i.Speaker]) {
                internalSecurity[i.Speaker] = 0;
            }
            internalSecurity[i.Speaker] ++;
        }

        if (i.Words) {
            if (!fewestWords[i.Speaker]) {
                fewestWords[i.Speaker] = 0;
            }
            fewestWords[i.Speaker] += i.Words;
        }
    }
    
    res.send(
        {
            "mostSpeeches": Object.keys(mostSpeeches).length ? Object.keys(mostSpeeches).reduce((a, b) => mostSpeeches[a] > mostSpeeches[b] ? a : b) : null,
            "mostSecurity": Object.keys(internalSecurity).length ? Object.keys(internalSecurity).reduce((a, b) => internalSecurity[a] > internalSecurity[b] ? a : b) : null,
            "leastWordy": Object.keys(fewestWords).length ? Object.keys(fewestWords).reduce((a, b) => fewestWords[a] < fewestWords[b] ? a : b) : null
        }
    );
});


app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}/evaluation?url=http://localhost:2000/speeches.csv`);
});