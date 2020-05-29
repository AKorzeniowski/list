declare global {
    namespace Cypress {
        interface Chainable {
            addCase: (
                country: string,
                notes: string,
                sourceUrl: string,
            ) => void;
            login: () => void;
            addSource: (name: string, url: string) => void;
        }
    }
}

export function addCase(
    country: string,
    notes: string,
    sourceUrl: string,
): void {
    cy.request({
        method: 'POST',
        url: '/api/cases',
        body: {
            location: {
                country: country,
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: notes,
            sources: [
                {
                    url: sourceUrl,
                },
            ],
            revisionMetadata: {
                date: new Date().toJSON(),
                id: 0,
                moderator: 'test',
            },
        },
    });
}

export function login(name?: string, email?: string, roles?: string[]): void {
    cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
            name: name ?? 'superuser',
            email: email ?? 'superuser@test.com',
            roles: roles ?? ['admin', 'curator', 'reader'],
        },
    });
}

export function addSource(name: string, url: string): void {
    cy.request({
        method: 'POST',
        url: '/api/sources',
        body: {
            name: name,
            origin: {
                url: url,
            },
        },
    });
}

Cypress.Commands.add('addCase', addCase);
Cypress.Commands.add('login', login);
Cypress.Commands.add('addSource', addSource);
