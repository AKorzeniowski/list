import { CaseDocument } from '../../src/model/case';
import { EventDocument } from '../../src/model/event';
import { parseCaseEvents, parseDownloadedCase } from '../../src/util/case';
import events from '../model/data/case.events.json';

describe('Case', () => {
    it('is parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseDownloadedCase({
            events,
            symptoms: {
                values: ['Cough', 'Pneumonia'],
            },
            demographics: {
                nationalities: [],
            },
        } as CaseDocument);

        expect(res.events).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01',
            },
        });

        expect(res.symptoms.values).toEqual('Cough,Pneumonia');
        expect(res.demographics.nationalities).toEqual('');
    });
    it('events are parsed properly for download', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Not necessary to mock full Mongoose type in JSON file
        const res = parseCaseEvents(events as EventDocument[]);

        expect(res).toEqual({
            onsetSymptoms: {
                value: '',
                date: '2020-11-14',
            },
            confirmed: {
                value: 'PCR test',
                date: '2020-11-19',
            },
            hospitalAdmission: {
                value: '',
                date: '2020-11-20',
            },
            outcome: {
                value: 'Recovered',
                date: '2020-12-01',
            },
        });
    });
});
