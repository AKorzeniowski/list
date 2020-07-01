import { Field, useFormikContext } from 'formik';

import { Autocomplete } from '@material-ui/lab';
import NewCaseFormValues from './NewCaseFormValues';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import axios from 'axios';

export default function Pathogens(): JSX.Element {
    return (
        <Scroll.Element name="pathogens">
            <fieldset>
                <legend>Pathogens</legend>
                <PathogensAutocomplete />
            </fieldset>
        </Scroll.Element>
    );
}

// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function PathogensAutocomplete(): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Map<string, number>>(
        new Map(),
    );
    const loading = open && options.keys.length === 0;
    const { setFieldValue, setTouched, initialValues } = useFormikContext<
        NewCaseFormValues
    >();

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async (): Promise<void> => {
            const resp = await axios.get<string>(
                'https://raw.githubusercontent.com/open-covid-data/healthmap-gdo-temp/master/suggest/pathogens.csv',
            );
            // CSV lines are of the form '123,Disease name' and we want to
            // map that to [{'Disease name', 123}]
            const retrievedOptions = new Map(
                resp.data.split('\n').map((option) => {
                    const optionArray = option.split(',');
                    return [optionArray[1], +optionArray[0]];
                }),
            );

            if (active) {
                setOptions(retrievedOptions);
            }
        })();

        return (): void => {
            active = false;
        };
    }, [initialValues, loading, setFieldValue, setOptions, setTouched]);

    React.useEffect(() => {
        if (!open) {
            setOptions(new Map());
        }
    }, [open, setOptions]);

    return (
        <Autocomplete
            multiple
            filterSelectedOptions
            itemType="string"
            open={open}
            onOpen={(): void => {
                setOpen(true);
            }}
            onClose={(): void => {
                setOpen(false);
            }}
            options={Array.from(options.keys())}
            loading={loading}
            onChange={(_, values): void => {
                setFieldValue(
                    'pathogens',
                    values?.map((pathogenName) => {
                        return {
                            name: pathogenName,
                            id: options.get(pathogenName),
                        };
                    }) ?? undefined,
                );
            }}
            onBlur={(): void => setTouched({ pathogens: true } as any)}
            defaultValue={initialValues.pathogens?.map(
                (pathogen) => pathogen.name,
            )}
            renderInput={(params): JSX.Element => (
                // Do not use FastField here
                <Field
                    {...params}
                    // Setting the name properly allows any typed value
                    // to be set in the form values, rather than only selected
                    // dropdown values. Thus we use an unused form value here.
                    name="unused"
                    data-testid={'pathogens'}
                    label={'Pathogens'}
                    component={TextField}
                ></Field>
            )}
        />
    );
}