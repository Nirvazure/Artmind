import assert from 'node:assert/strict'
import test from 'node:test'
import { githubAvatarUrl } from '../utils/github-avatar'

test('GitHub identity avatar takes precedence over an old custom avatar in user metadata', () => {
  assert.equal(
    githubAvatarUrl({
      user_metadata: { avatar_url: 'https://uploads.example.com/avatars/user.jpg' },
      identities: [
        {
          provider: 'github',
          identity_data: { avatar_url: 'https://avatars.githubusercontent.com/u/42?v=4' },
        },
      ],
    }),
    'https://avatars.githubusercontent.com/u/42?v=4',
  )
})

test('GitHub identity picture precedes metadata and ignores other identity providers', () => {
  assert.equal(
    githubAvatarUrl({
      user_metadata: { avatar_url: 'https://avatars.githubusercontent.com/u/1' },
      identities: [
        {
          provider: 'google',
          identity_data: { avatar_url: 'https://avatars.githubusercontent.com/u/2' },
        },
        {
          provider: 'github',
          identity_data: { picture: 'https://avatars.githubusercontent.com/u/3' },
        },
      ],
    }),
    'https://avatars.githubusercontent.com/u/3',
  )
})

test('valid GitHub metadata supplies the avatar when identity metadata is unavailable', () => {
  assert.equal(
    githubAvatarUrl({
      user_metadata: { avatar_url: 'https://avatars.githubusercontent.com/u/42' },
    }),
    'https://avatars.githubusercontent.com/u/42',
  )
  assert.equal(
    githubAvatarUrl({
      user_metadata: {
        avatar_url: 'https://uploads.example.com/avatar.jpg',
        picture: 'https://avatars.githubusercontent.com/u/43',
      },
    }),
    'https://avatars.githubusercontent.com/u/43',
  )
})

test('custom storage, lookalike hosts, non-HTTPS URLs, and malformed avatar values are rejected', () => {
  for (const avatar_url of [
    'https://uploads.example.com/avatars/42.jpg',
    'https://avatars.githubusercontent.com.evil.example/u/42',
    'http://avatars.githubusercontent.com/u/42',
    'https://evil.example@avatars.githubusercontent.com/u/42',
    'https://avatars.githubusercontent.com:8443/u/42',
    '/avatars/42.jpg',
    '',
    null,
    42,
  ]) {
    assert.equal(githubAvatarUrl({ user_metadata: { avatar_url } }), null)
  }
  assert.equal(githubAvatarUrl(null), null)
  assert.equal(githubAvatarUrl(undefined), null)
  assert.equal(githubAvatarUrl({ user_metadata: { user_name: 'octocat' } }), null)
})
